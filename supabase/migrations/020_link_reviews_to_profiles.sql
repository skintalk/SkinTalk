-- Migration: Link product_reviews to user_profiles for easier joins
-- Created: 2026-04-01

-- Add a foreign key from product_reviews(user_id) to user_profiles(id)
-- This allows PostgREST to recognize the relationship for joins like .select('*, user_profiles(name)')
ALTER TABLE public.product_reviews
DROP CONSTRAINT IF EXISTS product_reviews_user_id_fkey,
ADD CONSTRAINT product_reviews_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.user_profiles(id) 
    ON DELETE CASCADE;

-- Also verify that RLS allows reading user_profiles publicly
-- (Already exists in 002 but good to ensure)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname = 'Anyone can read user profiles'
    ) THEN
        CREATE POLICY "Anyone can read user profiles" ON public.user_profiles FOR SELECT USING (true);
    END IF;
END $$;
