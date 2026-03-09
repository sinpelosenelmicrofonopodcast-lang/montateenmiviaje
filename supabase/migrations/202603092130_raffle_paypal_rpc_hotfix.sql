-- Hotfix: ensure PayPal raffle reservation RPC exists even if previous migration failed midway.
-- Safe to run multiple times.

do $$
begin
  if to_regclass('public.app_raffle_entries') is not null then
    alter table public.app_raffle_entries
      add column if not exists reservation_group_id uuid,
      add column if not exists checkout_provider text;

    create index if not exists idx_app_raffle_entries_reservation_group
      on public.app_raffle_entries(reservation_group_id);
  end if;

  if to_regclass('public.app_raffle_payments') is not null then
    alter table public.app_raffle_payments
      add column if not exists reservation_group_id uuid,
      add column if not exists entry_ids jsonb not null default '[]'::jsonb,
      add column if not exists selected_numbers jsonb not null default '[]'::jsonb,
      add column if not exists paypal_order_id text,
      add column if not exists paypal_capture_id text,
      add column if not exists paypal_payer_id text,
      add column if not exists payer_email text,
      add column if not exists raw_order_response jsonb not null default '{}'::jsonb,
      add column if not exists raw_capture_response jsonb not null default '{}'::jsonb,
      add column if not exists reservation_expires_at timestamptz,
      add column if not exists paid_at timestamptz;

    alter table public.app_raffle_payments
      drop constraint if exists app_raffle_payments_status_check;

    alter table public.app_raffle_payments
      add constraint app_raffle_payments_status_check
      check (status in (
        'created',
        'pending',
        'approved',
        'captured',
        'completed',
        'failed',
        'rejected',
        'expired',
        'cancelled',
        'refunded'
      ));

    create index if not exists idx_app_raffle_payments_reservation_group
      on public.app_raffle_payments(reservation_group_id, status, created_at desc);

    create unique index if not exists idx_app_raffle_payments_paypal_order_unique
      on public.app_raffle_payments(paypal_order_id)
      where paypal_order_id is not null;

    create unique index if not exists idx_app_raffle_payments_paypal_capture_unique
      on public.app_raffle_payments(paypal_capture_id)
      where paypal_capture_id is not null;
  end if;
end $$;

do $$
begin
  if to_regclass('public.app_raffles') is null
    or to_regclass('public.app_raffle_numbers') is null
    or to_regclass('public.app_raffle_entries') is null
    or to_regclass('public.app_raffle_payments') is null then
    raise notice 'Skipping app_reserve_raffle_numbers_paypal hotfix: required tables missing.';
    return;
  end if;

  create or replace function public.app_reserve_raffle_numbers_paypal(
    p_raffle_id uuid,
    p_customer_id uuid,
    p_customer_email text,
    p_numbers integer[],
    p_public_display_name text default null,
    p_phone text default null,
    p_note text default null,
    p_referred_by_code text default null,
    p_reservation_minutes integer default 10
  )
  returns table(
    reservation_group_id uuid,
    reservation_expires_at timestamptz,
    selected_numbers integer[],
    entry_ids uuid[],
    total_amount numeric
  )
  language plpgsql
  security definer
  set search_path = public
  as $fn$
  declare
    v_raffle public.app_raffles%rowtype;
    v_group uuid := gen_random_uuid();
    v_now timestamptz := now();
    v_expires timestamptz;
    v_numbers integer[];
    v_entry_ids uuid[];
    v_total numeric;
    v_count integer;
    v_available integer;
  begin
    if p_raffle_id is null then
      raise exception 'raffle_id requerido';
    end if;
    if p_customer_id is null then
      raise exception 'customer_id requerido';
    end if;

    select *
      into v_raffle
    from public.app_raffles
    where id = p_raffle_id
    for update;

    if not found then
      raise exception 'Sorteo no encontrado';
    end if;

    if v_raffle.status <> 'published' then
      raise exception 'Este sorteo no está disponible';
    end if;

    if v_raffle.drawn_at is not null or now() >= v_raffle.draw_at then
      raise exception 'El sorteo ya cerró participaciones';
    end if;

    if now() < v_raffle.start_date then
      raise exception 'El sorteo aún no inicia';
    end if;

    select array_agg(distinct n order by n)
      into v_numbers
    from unnest(p_numbers) as n
    where n between 1 and v_raffle.number_pool_size;

    if v_numbers is null or coalesce(array_length(v_numbers, 1), 0) = 0 then
      raise exception 'Debes seleccionar al menos un número válido';
    end if;

    if array_length(v_numbers, 1) > 20 then
      raise exception 'Solo puedes seleccionar hasta 20 números por participación';
    end if;

    perform 1
    from public.app_raffle_numbers
    where raffle_id = p_raffle_id
      and number_value = any(v_numbers)
    for update;

    select count(*)
      into v_count
    from public.app_raffle_numbers
    where raffle_id = p_raffle_id
      and number_value = any(v_numbers);

    if v_count <> array_length(v_numbers, 1) then
      raise exception 'Uno o más números no existen en el sorteo';
    end if;

    select count(*)
      into v_available
    from public.app_raffle_numbers
    where raffle_id = p_raffle_id
      and number_value = any(v_numbers)
      and status = 'available';

    if v_available <> array_length(v_numbers, 1) then
      raise exception 'Uno o más números ya no están disponibles';
    end if;

    v_expires := v_now + make_interval(mins => greatest(1, least(coalesce(p_reservation_minutes, 10), 240)));

    with inserted as (
      insert into public.app_raffle_entries (
        raffle_id,
        customer_id,
        customer_email,
        chosen_number,
        payment_reference,
        note,
        status,
        source,
        public_display_name,
        consent_public_listing,
        payment_method,
        phone,
        referred_by_code,
        reservation_group_id,
        reservation_expires_at,
        checkout_provider,
        created_at,
        updated_at
      )
      select
        p_raffle_id,
        p_customer_id,
        lower(trim(p_customer_email)),
        n,
        null,
        nullif(trim(p_note), ''),
        'pending_payment',
        'online',
        nullif(trim(p_public_display_name), ''),
        false,
        'paypal',
        nullif(trim(p_phone), ''),
        upper(nullif(trim(p_referred_by_code), '')),
        v_group,
        v_expires,
        'paypal',
        v_now,
        v_now
      from unnest(v_numbers) as n
      returning id, chosen_number
    )
    update public.app_raffle_numbers rn
      set status = 'reserved',
          entry_id = i.id,
          customer_id = p_customer_id,
          customer_email = lower(trim(p_customer_email)),
          source = 'online',
          assigned_offline = false,
          payment_method = 'paypal',
          updated_by = null,
          updated_at = v_now,
          blocked_reason = null,
          blocked_at = null,
          blocked_by = null
    from inserted i
    where rn.raffle_id = p_raffle_id
      and rn.number_value = i.chosen_number;

    select array_agg(id order by chosen_number)
      into v_entry_ids
    from public.app_raffle_entries
    where reservation_group_id = v_group;

    v_total := round((coalesce(v_raffle.entry_fee, 0)::numeric * coalesce(array_length(v_numbers, 1), 0)::numeric), 2);

    insert into public.app_raffle_payments (
      raffle_id,
      entry_id,
      customer_id,
      customer_email,
      amount,
      currency,
      payment_method,
      is_manual,
      manually_verified,
      status,
      reservation_group_id,
      entry_ids,
      selected_numbers,
      reservation_expires_at,
      created_at,
      updated_at
    ) values (
      p_raffle_id,
      v_entry_ids[1],
      p_customer_id,
      lower(trim(p_customer_email)),
      v_total,
      'USD',
      'paypal',
      false,
      false,
      'created',
      v_group,
      to_jsonb(v_entry_ids),
      to_jsonb(v_numbers),
      v_expires,
      v_now,
      v_now
    );

    return query
    select v_group, v_expires, v_numbers, v_entry_ids, v_total;
  end;
  $fn$;
end $$;

notify pgrst, 'reload schema';
