-- Enable real-time for the tools table
-- This should be run in your Supabase SQL editor

-- Enable real-time on the tools table
alter publication supabase_realtime add table public.tools;

-- Optional: Enable RLS (Row Level Security) if needed
-- alter table public.tools enable row level security;

-- Optional: Create policies for real-time access if RLS is enabled
-- create policy "Enable real-time for all users" on public.tools for select using (true);
