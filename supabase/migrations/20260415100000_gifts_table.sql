create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  surname text,
  stripe_session_id text,
  status text not null default 'pending',
  personal_message text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

alter table public.gifts enable row level security;

create policy "Senders can view their own gifts"
  on public.gifts for select
  using (auth.uid() = sender_user_id);
