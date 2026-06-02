-- Run this in your Supabase SQL Editor

-- 1. Create the Users table
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT,
    age INT,
    dob DATE,
    place TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    interested_in TEXT CHECK (interested_in IN ('Male', 'Female')),
    photos TEXT[] DEFAULT '{}',
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Swipes/Interests table
CREATE TABLE public.interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(sender_id, receiver_id) -- Prevent duplicate swipes
);

-- 3. Create the Chats table
CREATE TABLE public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) for testing simplicity (you can secure these later)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;

-- 5. Setup Storage for Photos
-- Note: You'll also need to go to "Storage" in Supabase, create a bucket named "profile-pics", and make it Public.
