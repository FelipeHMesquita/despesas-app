# Despesas App

Registro de despesas com interface web, autenticação Supabase e tabela realtime.

## Stack

- **Next.js 14** (App Router, standalone output)
- **Supabase** (Auth + Postgres + Realtime)
- **Tailwind CSS** (tema dark customizado)
- **Docker** (deploy com docker-compose)

## Setup

### 1. Supabase

Execute o conteúdo de `supabase-setup.sql` no SQL Editor do seu projeto Supabase.

Copie a **URL** e **anon key** do projeto (Settings > API).

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha com suas credenciais:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Dev local

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

### 4. Deploy com Docker

Crie um `.env` na raiz com as mesmas variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

```bash
docker-compose up -d --build
```

A app ficará disponível na porta **3088**.

Se já usa Nginx como proxy reverso, adicione:

```nginx
server {
    listen 80;
    server_name despesas.seudominio.com;

    location / {
        proxy_pass http://localhost:3088;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Estrutura

```
despesas-app/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── DespesaForm.tsx
│   │   ├── DespesaTable.tsx
│   │   └── LoginForm.tsx
│   └── lib/
│       ├── supabase-browser.ts
│       └── types.ts
├── docker-compose.yml
├── Dockerfile
├── supabase-setup.sql
├── .env.local.example
└── package.json
```
