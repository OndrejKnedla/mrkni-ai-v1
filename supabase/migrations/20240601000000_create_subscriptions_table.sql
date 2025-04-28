-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create credits table to track usage
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_credits INTEGER NOT NULL DEFAULT 0,
    video_credits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create RLS policies for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read their own subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update/delete subscriptions
CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create RLS policies for credits
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
CREATE POLICY "Users can read their own credits"
    ON public.credits
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update/delete credits
CREATE POLICY "Service role can manage credits"
    ON public.credits
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to initialize credits for new users
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.credits (user_id, image_credits, video_credits)
    VALUES (NEW.id, 5, 0); -- Free tier: 5 image credits, 0 video credits
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to initialize credits for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_user_credits();

-- Create function to update credits when subscription changes
CREATE OR REPLACE FUNCTION public.update_user_credits_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Update credits based on subscription tier
    IF NEW.tier = 'premium' THEN
        -- Premium tier: 1000 image credits, 20 video credits
        UPDATE public.credits
        SET image_credits = 1000, video_credits = 20, updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSIF NEW.tier = 'basic' THEN
        -- Basic tier: 50 image credits, 5 video credits
        UPDATE public.credits
        SET image_credits = 50, video_credits = 5, updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSIF NEW.tier = 'free' THEN
        -- Free tier: 5 image credits, 0 video credits
        UPDATE public.credits
        SET image_credits = 5, video_credits = 0, updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update credits when subscription changes
CREATE TRIGGER on_subscription_change
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_credits_on_subscription();

-- Create function to decrement image credits
CREATE OR REPLACE FUNCTION public.decrement_image_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT image_credits INTO v_credits
    FROM public.credits
    WHERE user_id = p_user_id;

    -- Check if user has enough credits
    IF v_credits > 0 THEN
        -- Decrement credits
        UPDATE public.credits
        SET image_credits = image_credits - 1, updated_at = NOW()
        WHERE user_id = p_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to decrement video credits
CREATE OR REPLACE FUNCTION public.decrement_video_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT video_credits INTO v_credits
    FROM public.credits
    WHERE user_id = p_user_id;

    -- Check if user has enough credits
    IF v_credits > 0 THEN
        -- Decrement credits
        UPDATE public.credits
        SET video_credits = video_credits - 1, updated_at = NOW()
        WHERE user_id = p_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
