create extension if not exists pgcrypto;

create type public.university_mode as enum ('normal', 'exam', 'free');
create type public.task_status as enum ('pending', 'in_progress', 'completed', 'partial', 'failed');
create type public.lab_status as enum ('planned', 'attempted', 'completed');
create type public.difficulty as enum ('easy', 'medium', 'hard');

create table public.profiles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default '', goal text not null, track text not null,
  primary_focus text not null, secondary_focus text not null, future_focus text not null,
  university_mode public.university_mode not null default 'normal',
  preferred_session_minutes smallint not null default 50 check (preferred_session_minutes in (45, 50, 60)),
  weekly_capacity_hours numeric(4,1) not null default 11,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.career_goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, target_date date, status text not null default 'active', roadmap_stage text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null, mode public.university_mode not null, target_blocks smallint not null,
  ai_summary text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text not null, score numeric(3,1) not null default 0 check (score between 0 and 10),
  previous_score numeric(3,1) not null default 0 check (previous_score between 0 and 10),
  evidence text not null default '', weight numeric(4,3) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, name)
);

create table public.skill_progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade, previous_score numeric(3,1) not null,
  new_score numeric(3,1) not null, reason text not null, evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade, title text not null,
  description text not null, category text not null, duration_minutes smallint not null,
  difficulty public.difficulty not null default 'easy', objectives jsonb not null default '[]'::jsonb,
  success_criteria jsonb not null default '[]'::jsonb, recommended_resources jsonb not null default '[]'::jsonb,
  ai_help_limit smallint not null default 2 check (ai_help_limit between 0 and 4),
  status public.task_status not null default 'pending', is_daily_mission boolean not null default false,
  reflection jsonb, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create unique index one_daily_mission_per_user on public.tasks(user_id) where is_daily_mission = true;

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null, duration_minutes smallint not null,
  status public.task_status not null, notes text not null default '', completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.labs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, platform text not null, difficulty public.difficulty not null, category text not null,
  lab_date date not null default current_date, duration_minutes smallint not null default 0,
  status public.lab_status not null default 'planned', target text not null default '', recon text not null default '',
  enumeration text not null default '', attack_surface text not null default '', attempts text not null default '',
  exploitation text not null default '', privilege_escalation text not null default '', result text not null default '',
  stuck text not null default '', learned text not null default '', ai_assistance_level smallint not null default 0 check (ai_assistance_level between 0 and 4),
  walkthrough_used boolean not null default false, notes text not null default '', key_learnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.lab_notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  lab_id uuid not null references public.labs(id) on delete cascade, section text not null, content text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.ai_assistance_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade, lab_id uuid references public.labs(id) on delete cascade,
  level smallint not null check (level between 0 and 4), request text not null default '', response_summary text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period in ('weekly', 'monthly')), title text not null, review_date date not null,
  summary text not null, strongest_area text not null, weakest_area text not null, metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, category text not null, content text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, severity text not null, description text not null default '', evidence text not null default '',
  impact text not null default '', steps_to_reproduce text not null default '', remediation text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.vocabulary (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  term text not null, meaning text not null, example_sentence text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, term)
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null, lab_id uuid references public.labs(id) on delete set null,
  service text not null check (service in ('planner', 'mentor', 'reviewer', 'skill_evaluator', 'career_coach')),
  messages jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ declare t text; begin
  foreach t in array array['profiles','career_goals','weekly_plans','skills','skill_progress','tasks','focus_sessions','labs','lab_notes','ai_assistance_logs','reviews','notes','reports','vocabulary','ai_conversations']
  loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t); end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','career_goals','weekly_plans','skills','skill_progress','tasks','focus_sessions','labs','lab_notes','ai_assistance_logs','reviews','notes','reports','vocabulary','ai_conversations']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Users manage own %I" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;

create or replace function public.handle_new_user() returns trigger security definer set search_path = public language plpgsql as $$
declare profile_id uuid; plan_id uuid;
begin
  insert into profiles(user_id, full_name, goal, track, primary_focus, secondary_focus, future_focus)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'Become a Penetration Tester', 'Offensive Security', 'Network / Internal Pentest', 'Cloud Security', 'Red Team') returning id into profile_id;
  insert into career_goals(user_id, title, roadmap_stage) values(new.id, 'Independently solve easy and some medium pentest labs without walkthroughs.', 'Months 1–3');
  insert into weekly_plans(user_id, week_start, mode, target_blocks, ai_summary) values(new.id, date_trunc('week', current_date)::date, 'normal', 10, 'Build a repeatable enumeration workflow before adding more exploitation techniques.') returning id into plan_id;
  insert into skills(user_id, name, category, score, previous_score, weight, evidence) values
    (new.id,'Networking','Networking',3,3,.20,'Initial assessment'), (new.id,'Pentest Workflow','Pentesting',2,2,.20,'Initial assessment'),
    (new.id,'Linux','Linux',6,6,.10,'Initial assessment'), (new.id,'Web Security','Web Security',4,4,.10,'Initial assessment'),
    (new.id,'Python/Bash','Scripting',6,6,.10,'Initial assessment'), (new.id,'Reporting','Reporting',1,1,.10,'Initial assessment'),
    (new.id,'Active Directory','Active Directory',1,1,.10,'Initial assessment'), (new.id,'English','English',3,3,.05,'Initial assessment'),
    (new.id,'Portfolio','Portfolio',1,1,.05,'Initial assessment');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
