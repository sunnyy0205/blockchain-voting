
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('company', 'voter');

-- Create enum for election status
CREATE TYPE public.election_status AS ENUM ('active', 'closed', 'upcoming');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Elections table
CREATE TABLE public.elections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  contract_address TEXT,
  status public.election_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own elections" ON public.elections FOR SELECT USING (
  company_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Voters can view active elections" ON public.elections FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'voter')
);
CREATE POLICY "Companies can create elections" ON public.elections FOR INSERT WITH CHECK (
  company_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'company')
);
CREATE POLICY "Companies can update own elections" ON public.elections FOR UPDATE USING (
  company_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'company')
);

-- Candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  votes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view candidates" ON public.candidates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Companies can create candidates" ON public.candidates FOR INSERT WITH CHECK (
  election_id IN (
    SELECT e.id FROM public.elections e
    JOIN public.profiles p ON p.id = e.company_id
    WHERE p.user_id = auth.uid() AND p.role = 'company'
  )
);
CREATE POLICY "System can update candidate votes" ON public.candidates FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(voter_id, election_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voters can view own votes" ON public.votes FOR SELECT USING (
  voter_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Voters can cast votes" ON public.votes FOR INSERT WITH CHECK (
  voter_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'voter')
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_elections_updated_at BEFORE UPDATE ON public.elections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'voter'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
