-- Tabela de despesas
create table if not exists despesas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  data date not null,
  descricao text not null,
  categoria text not null check (categoria in ('ferramenta','anuncios','pessoal','imposto','servicos')),
  valor numeric(10,2) not null check (valor > 0),
  user_id uuid references auth.users(id) on delete cascade not null
);

-- RLS
alter table despesas enable row level security;

create policy "usuarios veem apenas suas despesas"
  on despesas for select
  using (auth.uid() = user_id);

create policy "usuarios inserem suas despesas"
  on despesas for insert
  with check (auth.uid() = user_id);

create policy "usuarios atualizam suas despesas"
  on despesas for update
  using (auth.uid() = user_id);

create policy "usuarios deletam suas despesas"
  on despesas for delete
  using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table despesas;
