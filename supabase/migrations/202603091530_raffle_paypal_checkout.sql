-- PayPal Business checkout support for raffles (additive, backward-compatible)

-- 1) Extend raffle entries for grouped reservations
DO $$
BEGIN
  IF to_regclass('public.app_raffle_entries') IS NOT NULL THEN
    ALTER TABLE public.app_raffle_entries
      ADD COLUMN IF NOT EXISTS reservation_group_id uuid,
      ADD COLUMN IF NOT EXISTS checkout_provider text;

    CREATE INDEX IF NOT EXISTS idx_app_raffle_entries_reservation_group
      ON public.app_raffle_entries(reservation_group_id);
  END IF;
END $$;

-- 2) Extend raffle payments for PayPal order/capture lifecycle
DO $$
BEGIN
  IF to_regclass('public.app_raffle_payments') IS NOT NULL THEN
    ALTER TABLE public.app_raffle_payments
      ADD COLUMN IF NOT EXISTS reservation_group_id uuid,
      ADD COLUMN IF NOT EXISTS entry_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS selected_numbers jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS paypal_order_id text,
      ADD COLUMN IF NOT EXISTS paypal_capture_id text,
      ADD COLUMN IF NOT EXISTS paypal_payer_id text,
      ADD COLUMN IF NOT EXISTS payer_email text,
      ADD COLUMN IF NOT EXISTS raw_order_response jsonb NOT NULL DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS raw_capture_response jsonb NOT NULL DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz,
      ADD COLUMN IF NOT EXISTS paid_at timestamptz;

    ALTER TABLE public.app_raffle_payments
      DROP CONSTRAINT IF EXISTS app_raffle_payments_status_check;

    ALTER TABLE public.app_raffle_payments
      ADD CONSTRAINT app_raffle_payments_status_check
      CHECK (status IN (
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

    CREATE INDEX IF NOT EXISTS idx_app_raffle_payments_reservation_group
      ON public.app_raffle_payments(reservation_group_id, status, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_app_raffle_payments_paypal_order_unique
      ON public.app_raffle_payments(paypal_order_id)
      WHERE paypal_order_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_app_raffle_payments_paypal_capture_unique
      ON public.app_raffle_payments(paypal_capture_id)
      WHERE paypal_capture_id IS NOT NULL;
  END IF;
END $$;

-- 3) Atomic reservation for raffle numbers before creating PayPal order
DO $$
BEGIN
  IF to_regclass('public.app_raffles') IS NULL
    OR to_regclass('public.app_raffle_numbers') IS NULL
    OR to_regclass('public.app_raffle_entries') IS NULL
    OR to_regclass('public.app_raffle_payments') IS NULL THEN
    RAISE NOTICE 'Skipping app_reserve_raffle_numbers_paypal creation because required tables are missing.';
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION public.app_reserve_raffle_numbers_paypal(
    p_raffle_id uuid,
    p_customer_id uuid,
    p_customer_email text,
    p_numbers integer[],
    p_public_display_name text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_note text DEFAULT NULL,
    p_referred_by_code text DEFAULT NULL,
    p_reservation_minutes integer DEFAULT 10
  )
  RETURNS TABLE(
    reservation_group_id uuid,
    reservation_expires_at timestamptz,
    selected_numbers integer[],
    entry_ids uuid[],
    total_amount numeric
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
  DECLARE
    v_raffle public.app_raffles%ROWTYPE;
    v_group uuid := gen_random_uuid();
    v_now timestamptz := now();
    v_expires timestamptz;
    v_numbers integer[];
    v_entry_ids uuid[];
    v_total numeric;
    v_count integer;
    v_available integer;
  BEGIN
    IF p_raffle_id IS NULL THEN
      RAISE EXCEPTION 'raffle_id requerido';
    END IF;
    IF p_customer_id IS NULL THEN
      RAISE EXCEPTION 'customer_id requerido';
    END IF;

    SELECT *
      INTO v_raffle
    FROM public.app_raffles
    WHERE id = p_raffle_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sorteo no encontrado';
    END IF;

    IF v_raffle.status <> 'published' THEN
      RAISE EXCEPTION 'Este sorteo no está disponible';
    END IF;

    IF v_raffle.drawn_at IS NOT NULL OR now() >= v_raffle.draw_at THEN
      RAISE EXCEPTION 'El sorteo ya cerró participaciones';
    END IF;

    IF now() < v_raffle.start_date THEN
      RAISE EXCEPTION 'El sorteo aún no inicia';
    END IF;

    SELECT ARRAY_AGG(DISTINCT n ORDER BY n)
      INTO v_numbers
    FROM unnest(p_numbers) AS n
    WHERE n BETWEEN 1 AND v_raffle.number_pool_size;

    IF v_numbers IS NULL OR COALESCE(array_length(v_numbers, 1), 0) = 0 THEN
      RAISE EXCEPTION 'Debes seleccionar al menos un número válido';
    END IF;

    IF array_length(v_numbers, 1) > 20 THEN
      RAISE EXCEPTION 'Solo puedes seleccionar hasta 20 números por participación';
    END IF;

    -- Lock rows to avoid race conditions.
    PERFORM 1
    FROM public.app_raffle_numbers
    WHERE raffle_id = p_raffle_id
      AND number_value = ANY(v_numbers)
    FOR UPDATE;

    SELECT COUNT(*)
      INTO v_count
    FROM public.app_raffle_numbers
    WHERE raffle_id = p_raffle_id
      AND number_value = ANY(v_numbers);

    IF v_count <> array_length(v_numbers, 1) THEN
      RAISE EXCEPTION 'Uno o más números no existen en el sorteo';
    END IF;

    SELECT COUNT(*)
      INTO v_available
    FROM public.app_raffle_numbers
    WHERE raffle_id = p_raffle_id
      AND number_value = ANY(v_numbers)
      AND status = 'available';

    IF v_available <> array_length(v_numbers, 1) THEN
      RAISE EXCEPTION 'Uno o más números ya no están disponibles';
    END IF;

    v_expires := v_now + make_interval(mins => GREATEST(1, LEAST(COALESCE(p_reservation_minutes, 10), 240)));

    WITH inserted AS (
      INSERT INTO public.app_raffle_entries (
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
      SELECT
        p_raffle_id,
        p_customer_id,
        lower(trim(p_customer_email)),
        n,
        NULL,
        NULLIF(trim(p_note), ''),
        'pending_payment',
        'online',
        NULLIF(trim(p_public_display_name), ''),
        false,
        'paypal',
        NULLIF(trim(p_phone), ''),
        upper(NULLIF(trim(p_referred_by_code), '')),
        v_group,
        v_expires,
        'paypal',
        v_now,
        v_now
      FROM unnest(v_numbers) AS n
      RETURNING id, chosen_number
    )
    UPDATE public.app_raffle_numbers rn
      SET status = 'reserved',
          entry_id = i.id,
          customer_id = p_customer_id,
          customer_email = lower(trim(p_customer_email)),
          source = 'online',
          assigned_offline = false,
          payment_method = 'paypal',
          updated_by = NULL,
          updated_at = v_now,
          blocked_reason = NULL,
          blocked_at = NULL,
          blocked_by = NULL
    FROM inserted i
    WHERE rn.raffle_id = p_raffle_id
      AND rn.number_value = i.chosen_number;

    SELECT ARRAY_AGG(id ORDER BY chosen_number)
      INTO v_entry_ids
    FROM public.app_raffle_entries
    WHERE reservation_group_id = v_group;

    v_total := ROUND((COALESCE(v_raffle.entry_fee, 0)::numeric * COALESCE(array_length(v_numbers, 1), 0)::numeric), 2);

    INSERT INTO public.app_raffle_payments (
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
    ) VALUES (
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

    RETURN QUERY
    SELECT v_group, v_expires, v_numbers, v_entry_ids, v_total;
  END;
  $fn$;
END $$;

NOTIFY pgrst, 'reload schema';
