-- 1. UPDATE THE PROFILES TABLE
-- We link it to 'auth.users' using the ID
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default now(),
  username text unique,
  full_name text,
  avatar_url text,
  
  -- Football Specific Data
  fav_team_name text,
  fav_team_id int4,
  
  constraint username_length check (char_length(username) >= 3)
);

-- 2. ENABLE SECURITY
alter table public.profiles enable row level security;

-- 3. CREATE POLICIES
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 4. THE AUTOMATION (The "Trigger")
-- This function runs every time a new row enters 'auth.users' (Sign up)
create or replace function public.handle_new_user()
returns trigger 
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- 5. BIND THE TRIGGER TO THE AUTH SYSTEM
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();







  -- 1. Remove the old single-team columns
alter table public.profiles 
drop column if exists fav_team_name,
drop column if exists fav_team_id;

-- 2. Add the new multi-team JSON array column
alter table public.profiles 
add column if not exists favorite_teams jsonb default '[]'::jsonb;