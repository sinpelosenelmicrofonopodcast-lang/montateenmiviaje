-- Link customer records to Supabase Auth users for secure portal access

alter table if exists app_customers
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists idx_app_customers_auth_user_id
  on app_customers(auth_user_id)
  where auth_user_id is not null;

create index if not exists idx_app_customers_email
  on app_customers(email);
