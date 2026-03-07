-- Trip-level manual "Desde" price for cards/admin/PDF fallback

alter table if exists app_trips
  add column if not exists price_from numeric(12,2);

update app_trips t
set price_from = pkg.min_price
from (
  select trip_id, min(price_per_person) as min_price
  from app_trip_packages
  group by trip_id
) pkg
where t.id = pkg.trip_id
  and (t.price_from is null or t.price_from <= 0);

alter table if exists app_trips
  drop constraint if exists app_trips_price_from_positive_check;

alter table if exists app_trips
  add constraint app_trips_price_from_positive_check
  check (price_from is null or price_from > 0);
