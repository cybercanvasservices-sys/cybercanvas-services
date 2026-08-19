-- CyberCanvas Services - verification RLS
-- A executer dans Supabase SQL Editor apres les migrations.
-- La 1re requete montre quelles tables ont RLS activee.
-- La 2e requete liste les policies existantes.

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;