-- Configuração inicial do bucket privado para a demonstração do TCCHAT.
-- Execute no SQL Editor do Supabase após habilitar Firebase como provedor de
-- terceiros e configurar a claim JWT `role: authenticated`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tcchat-arquivos',
  'tcchat-arquivos',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'application/zip',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- O UID do Firebase fica na primeira pasta e vem da claim `sub` do token.
drop policy if exists "TCCHAT demo: aluno envia no proprio caminho" on storage.objects;
create policy "TCCHAT demo: aluno envia no proprio caminho"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'tcchat-arquivos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

-- A política de leitura ampla permite que professores abram entregas de alunos
-- na demonstração. Ela deve ser restringida por turma/papel antes de produção.
drop policy if exists "TCCHAT demo: usuarios autenticados leem arquivos" on storage.objects;
create policy "TCCHAT demo: usuarios autenticados leem arquivos"
on storage.objects for select to authenticated
using (bucket_id = 'tcchat-arquivos');

-- Permite que cada usuário limpe objetos que enviou, por exemplo quando um
-- recurso da biblioteca é excluído junto com seu registro no Firestore.
drop policy if exists "TCCHAT demo: usuario remove proprio arquivo" on storage.objects;
create policy "TCCHAT demo: usuario remove proprio arquivo"
on storage.objects for delete to authenticated
using (
  bucket_id = 'tcchat-arquivos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);
