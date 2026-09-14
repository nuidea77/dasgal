-- Optional cloud sync schema. Only profile JSON and workout stats are stored.
create table if not exists profiles (
  device_id text primary key,
  profile jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists workouts (
  id text primary key,
  device_id text not null references profiles(device_id) on delete cascade,
  record jsonb not null,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists workouts_device_date on workouts(device_id, date);
