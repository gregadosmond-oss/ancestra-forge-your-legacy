-- Add story caching to surname_facts so we don't regenerate story on every visit
alter table public.surname_facts add column if not exists story_payload jsonb;
