-- Create interested_users table to store emails of people interested in the app launch
CREATE TABLE IF NOT EXISTS public.interested_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notified BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create RLS policies for interested_users
ALTER TABLE public.interested_users ENABLE ROW LEVEL SECURITY;

-- Only service role can read all interested users
CREATE POLICY "Service role can read all interested users"
    ON public.interested_users
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Only service role can insert/update/delete interested users
CREATE POLICY "Service role can manage interested users"
    ON public.interested_users
    USING (auth.jwt() ->> 'role' = 'service_role');
