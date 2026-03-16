# FinFamília — Controle Financeiro Familiar

## Escopo do Projeto

**Versão:** 1.0
**Data:** 15/03/2026
**Autor:** Felipe Mesquita

---

## 1. Visão Geral

Sistema de controle financeiro familiar com interface web (dashboard) e interação via WhatsApp (menus com botões). Os relatórios são templates HTML pré-renderizados via SSR, sem consumo de tokens de IA. O registro de gastos e consultas é feito pelo WhatsApp através de menus interativos da API Business.

### 1.1 Problema

Falta de visibilidade unificada dos gastos do casal (múltiplos cartões, Pix, categorias misturadas), dificuldade de controlar limites por categoria e acompanhar metas de economia — especialmente com a chegada do bebê em Dez/2026.

### 1.2 Solução

Dashboard web com visão consolidada + bot WhatsApp por botões para registro e consulta rápida + relatórios estáticos por URL compartilhável.

### 1.3 Princípios

- **Zero IA nos relatórios** — templates SSR com dados do banco, sem tokens
- **WhatsApp por botões** — sem NLP, sem interpretação de texto livre, só menus interativos
- **Único input livre** — apenas o valor numérico ao registrar um gasto
- **URLs compartilháveis** — relatórios acessíveis por link privado com expiração

---

## 2. Stack Técnico

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend/Dashboard | Next.js 14 (App Router) | SSR para relatórios + SPA para dashboard |
| Estilização | Tailwind CSS | Produtividade, design system consistente |
| Banco de dados | Supabase (PostgreSQL) | Auth, RLS, Realtime, API REST automática |
| Autenticação | Supabase Auth | Magic link para acesso ao dashboard |
| Automação/Bot | n8n (self-hosted) | Webhooks WhatsApp, lógica de menus, registro de gastos |
| WhatsApp | API Business (Cloud API) | Mensagens interativas com botões e listas |
| Hospedagem | Hetzner (já possui) | VPS para n8n + Next.js |
| Deploy | Docker Compose | n8n + Next.js + Nginx em containers |

---

## 3. Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │────▶│    n8n       │────▶│  Supabase   │◀────│  Next.js    │
│  (usuário)  │◀────│  (webhooks) │     │  (PostgreSQL)│────▶│  (SSR/SPA)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │                    │
      │  Botões/Menus      │  Lógica de fluxo   │  Dados + Auth      │  Dashboard +
      │  interativos       │  INSERT/SELECT      │  RLS por família   │  Relatórios URL
      │                    │  Monta URLs         │                    │
```

### 3.1 Fluxo: Registrar Gasto

```
Usuário clica "💰 Registrar gasto"
  → n8n envia lista de categorias (botões)
    → Usuário clica categoria
      → n8n envia lista de titulares (botões)
        → Usuário clica titular
          → n8n pede valor (único input livre)
            → Usuário digita "32.50"
              → n8n envia confirmação (botões Sim/Não)
                → INSERT no Supabase
                  → n8n responde com saldo atualizado da categoria
```

### 3.2 Fluxo: Solicitar Relatório

```
Usuário clica "📈 Relatórios"
  → n8n envia submenu de relatórios (botões)
    → Usuário clica tipo de relatório
      → n8n monta URL: /r/{uid}/{tipo}/{periodo}
        → n8n envia link no WhatsApp
          → Usuário abre no navegador
            → Next.js SSR puxa dados do Supabase
              → Renderiza HTML estático com gráficos
```

### 3.3 Fluxo: Consulta Rápida (sem URL)

```
Usuário clica "📊 Ver resumo" ou "📋 Ver limites"
  → n8n faz SELECT no Supabase
    → n8n formata texto com dados
      → Responde direto no WhatsApp (sem link)
        → Inclui barra de progresso ASCII: ▓▓▓▓░░░░ 65%
```

---

## 4. Schema do Banco (Supabase)

### 4.1 Tabelas

#### `families`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | ID da família |
| name | text | Nome da família |
| created_at | timestamptz | Data de criação |

#### `members`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | ID do membro |
| family_id | uuid FK → families | Família |
| name | text | Nome (ex: Felipe, Andressa) |
| phone | text | Telefone WhatsApp (E.164) |
| role | text | "admin" ou "member" |
| created_at | timestamptz | Data de criação |

#### `categories`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | ID da categoria |
| family_id | uuid FK → families | Família |
| name | text | Nome (ex: Transporte, iFood) |
| emoji | text | Emoji da categoria |
| slug | text | Slug para URL (ex: transporte) |
| monthly_limit | numeric(10,2) | Limite mensal em R$ |
| is_active | boolean | Ativa ou não |
| sort_order | integer | Ordem de exibição |

#### `expenses`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | ID do gasto |
| family_id | uuid FK → families | Família |
| category_id | uuid FK → categories | Categoria |
| member_id | uuid FK → members | Quem gastou |
| amount | numeric(10,2) | Valor em R$ |
| description | text | Descrição (opcional) |
| source | text | "whatsapp", "dashboard", "import" |
| expense_date | date | Data do gasto |
| created_at | timestamptz | Data de registro |

#### `installments`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | ID da parcela |
| family_id | uuid FK → families | Família |
| member_id | uuid FK → members | Titular |
| description | text | Descrição (ex: Casas Bahia) |
| installment_amount | numeric(10,2) | Valor da parcela |
| current_installment | integer | Parcela atual |
| total_installments | integer | Total de parcelas |
| start_date | date | Data da primeira parcela |
| end_date | date | Data da última parcela |
| category_id | uuid FK → categories | Categoria (opcional) |
| is_active | boolean | Ativa ou encerrada |

#### `goals`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | ID da meta |
| family_id | uuid FK → families | Família |
| name | text | Nome da meta |
| slug | text | Slug para URL |
| emoji | text | Emoji |
| target_amount | numeric(10,2) | Valor alvo |
| current_amount | numeric(10,2) | Valor acumulado |
| target_date | date | Data limite |
| is_active | boolean | Ativa ou não |

#### `report_tokens`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | ID do token |
| family_id | uuid FK → families | Família |
| token | text UNIQUE | Token curto para URL (ex: fm82x) |
| report_type | text | Tipo do relatório |
| params | jsonb | Parâmetros (período, categoria, etc.) |
| expires_at | timestamptz | Expiração do link |
| created_at | timestamptz | Data de criação |

#### `monthly_summaries` (view materializada ou tabela cache)

| Coluna | Tipo | Descrição |
|---|---|---|
| family_id | uuid | Família |
| year_month | text | "2026-03" |
| category_id | uuid | Categoria |
| total_spent | numeric(10,2) | Total gasto na categoria |
| monthly_limit | numeric(10,2) | Limite da categoria |
| percentage_used | numeric(5,2) | % utilizado |
| status | text | "ok", "warning", "over" |

### 4.2 Views Supabase

#### `v_category_spending`

```sql
SELECT
  e.family_id,
  to_char(e.expense_date, 'YYYY-MM') AS year_month,
  c.id AS category_id,
  c.name AS category_name,
  c.emoji,
  c.monthly_limit,
  SUM(e.amount) AS total_spent,
  ROUND(SUM(e.amount) / NULLIF(c.monthly_limit, 0) * 100, 1) AS pct_used,
  CASE
    WHEN SUM(e.amount) > c.monthly_limit THEN 'over'
    WHEN SUM(e.amount) > c.monthly_limit * 0.85 THEN 'warning'
    ELSE 'ok'
  END AS status
FROM expenses e
JOIN categories c ON c.id = e.category_id
GROUP BY e.family_id, year_month, c.id, c.name, c.emoji, c.monthly_limit;
```

#### `v_active_installments`

```sql
SELECT
  i.*,
  m.name AS member_name,
  i.total_installments - i.current_installment AS remaining,
  to_char(i.end_date, 'Mon/YYYY') AS ends_label
FROM installments i
JOIN members m ON m.id = i.member_id
WHERE i.is_active = true
ORDER BY i.end_date ASC;
```

#### `v_monthly_relief`

```sql
SELECT
  to_char(i.end_date, 'YYYY-MM') AS relief_month,
  SUM(i.installment_amount) AS relief_amount,
  array_agg(i.description) AS ending_items
FROM installments i
WHERE i.is_active = true
GROUP BY relief_month
ORDER BY relief_month;
```

### 4.3 RLS (Row Level Security)

```sql
-- Todas as tabelas com family_id usam a mesma política:
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem apenas sua família"
  ON expenses FOR ALL
  USING (family_id IN (
    SELECT family_id FROM members WHERE phone = auth.jwt()->>'phone'
  ));

-- Mesmo padrão para: categories, installments, goals, report_tokens
```

### 4.4 Functions (RPC)

#### `fn_register_expense`

```sql
CREATE OR REPLACE FUNCTION fn_register_expense(
  p_family_id uuid,
  p_category_slug text,
  p_member_phone text,
  p_amount numeric,
  p_description text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_category categories%ROWTYPE;
  v_member members%ROWTYPE;
  v_month_total numeric;
  v_remaining numeric;
BEGIN
  SELECT * INTO v_category FROM categories
    WHERE family_id = p_family_id AND slug = p_category_slug;

  SELECT * INTO v_member FROM members
    WHERE family_id = p_family_id AND phone = p_member_phone;

  INSERT INTO expenses (family_id, category_id, member_id, amount, description, source, expense_date)
  VALUES (p_family_id, v_category.id, v_member.id, p_amount, p_description, 'whatsapp', CURRENT_DATE);

  SELECT COALESCE(SUM(amount), 0) INTO v_month_total
  FROM expenses
  WHERE family_id = p_family_id
    AND category_id = v_category.id
    AND to_char(expense_date, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM');

  v_remaining := v_category.monthly_limit - v_month_total;

  RETURN jsonb_build_object(
    'success', true,
    'category', v_category.name,
    'emoji', v_category.emoji,
    'amount', p_amount,
    'month_total', v_month_total,
    'limit', v_category.monthly_limit,
    'remaining', v_remaining,
    'pct_used', ROUND(v_month_total / NULLIF(v_category.monthly_limit, 0) * 100, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `fn_generate_report_token`

```sql
CREATE OR REPLACE FUNCTION fn_generate_report_token(
  p_family_id uuid,
  p_report_type text,
  p_params jsonb DEFAULT '{}'
) RETURNS text AS $$
DECLARE
  v_token text;
BEGIN
  v_token := substr(md5(random()::text), 1, 8);

  INSERT INTO report_tokens (family_id, token, report_type, params, expires_at)
  VALUES (p_family_id, v_token, p_report_type, p_params, NOW() + INTERVAL '24 hours');

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Rotas Next.js

### 5.1 Dashboard (SPA autenticado)

| Rota | Descrição |
|---|---|
| `/` | Redirect para `/dashboard` |
| `/login` | Magic link via Supabase Auth |
| `/dashboard` | Dashboard principal com KPIs, gráficos, metas |
| `/dashboard/orcamento` | Orçamento por categoria com edição de limites |
| `/dashboard/cartoes` | Visão por cartão/titular |
| `/dashboard/parcelas` | Lista de parcelas com timeline de alívio |
| `/dashboard/metas` | Metas de economia com progresso |
| `/dashboard/transacoes` | Tabela completa de transações com filtros |
| `/dashboard/configuracoes` | Categorias, membros, limites, WhatsApp |

### 5.2 Relatórios (SSR público com token)

| Rota | Descrição |
|---|---|
| `/r/[token]` | Renderiza qualquer relatório pelo token |

O token resolve para `report_type` + `params` no banco. O Next.js renderiza o template correspondente com SSR.

**Templates disponíveis:**

| report_type | Params | Descrição |
|---|---|---|
| `mensal` | `{ "year_month": "2026-03" }` | Resumo mensal completo |
| `comparativo` | `{ "year_month": "2026-03" }` | Comparativo com mês anterior |
| `meta` | `{ "slug": "bebe" }` | Progresso de meta específica |
| `parcelas` | `{}` | Parcelas ativas com projeção |
| `categoria` | `{ "slug": "ifood", "year_month": "2026-03" }` | Drill-down de categoria |
| `evolucao` | `{ "periodo": "6m" }` | Evolução histórica |

### 5.3 API Routes (Next.js)

| Rota | Método | Descrição |
|---|---|---|
| `/api/webhook/whatsapp` | POST | Recebe mensagens do WhatsApp (ou n8n chama direto o Supabase) |
| `/api/reports/generate` | POST | Gera token de relatório e retorna URL |

---

## 6. Workflows n8n

### 6.1 WF01 — Menu Principal WhatsApp

**Trigger:** Webhook recebe mensagem do WhatsApp
**Lógica:**

```
1. Identifica o telefone remetente
2. Busca member + family_id no Supabase
3. Se mensagem é resposta de botão:
   a. "resumo"     → WF02 (Consulta Rápida)
   b. "registrar"  → WF03 (Registro de Gasto)
   c. "limites"    → WF02 (Consulta Rápida)
   d. "relatorios" → WF04 (Submenu Relatórios)
4. Se não reconhece → reenvia menu principal
```

### 6.2 WF02 — Consulta Rápida (resposta inline)

**Input:** tipo de consulta + family_id
**Lógica:**

```
1. SELECT na v_category_spending para o mês atual
2. Formata mensagem com:
   - Total gasto vs meta
   - Categorias com barra ASCII (▓░)
   - Alertas de categorias estouradas
3. Envia resposta no WhatsApp + botão "Voltar ao menu"
```

### 6.3 WF03 — Registro de Gasto (fluxo multi-step)

**Controle de estado:** n8n armazena o passo atual por telefone (variável de workflow ou tabela `wa_sessions`)

```
Passo 1: Envia botões de categorias
Passo 2: Recebe categoria → Envia botões de titulares
Passo 3: Recebe titular → Pede valor (texto livre)
Passo 4: Recebe valor → Envia confirmação com botões
Passo 5: Recebe confirmação →
  - Se "sim": chama fn_register_expense → responde com saldo
  - Se "não": cancela → volta ao menu
```

### 6.4 WF04 — Submenu Relatórios (gera URL)

**Input:** tipo de relatório
**Lógica:**

```
1. Recebe escolha do tipo de relatório
2. Chama fn_generate_report_token no Supabase
3. Monta URL: https://finfamilia.app/r/{token}
4. Envia link no WhatsApp com preview
5. Botão "Voltar ao menu"
```

### 6.5 WF05 — Alertas Automáticos (CRON)

**Trigger:** Agendamento diário às 20h
**Lógica:**

```
1. Para cada família ativa:
2. Verifica categorias com > 85% do limite
3. Verifica parcelas que encerram este mês
4. Se há alertas → envia mensagem proativa no WhatsApp:
   "⚠️ Atenção: iFood já usou 92% do limite (R$184/R$200)"
```

### 6.6 WF06 — Importação de Fatura (manual)

**Trigger:** Webhook ou upload no dashboard
**Lógica:**

```
1. Recebe PDF da fatura (Bradesco/Nubank)
2. Extrai transações (parser específico por banco)
3. Categoriza automaticamente por regras:
   - "UBER" / "99*" → Transporte
   - "IFD*iFood" → iFood
   - "ARMAZZEM" / "FORMOSA" → Mercado
   - etc.
4. INSERT em batch no expenses
5. Atualiza installments se detectar parcelas
```

---

## 7. WhatsApp — Estrutura de Mensagens

### 7.1 Menu Principal

```json
{
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Olá Felipe! 👋 Escolha uma opção:"
    },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "resumo", "title": "📊 Ver resumo" } },
        { "type": "reply", "reply": { "id": "registrar", "title": "💰 Registrar gasto" } },
        { "type": "reply", "reply": { "id": "limites", "title": "📋 Ver limites" } }
      ]
    }
  }
}
```

> **Nota:** A API do WhatsApp permite no máximo 3 botões por mensagem. Para o submenu de relatórios, usar `interactive.type: "list"` que suporta até 10 opções.

### 7.2 Lista de Relatórios

```json
{
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "Qual relatório deseja?" },
    "action": {
      "button": "📈 Ver relatórios",
      "sections": [{
        "title": "Relatórios disponíveis",
        "rows": [
          { "id": "rel_mensal", "title": "📊 Resumo mensal", "description": "KPIs e categorias do mês" },
          { "id": "rel_comparativo", "title": "📉 Comparativo", "description": "Mês atual vs anterior" },
          { "id": "rel_bebe", "title": "👶 Reserva do bebê", "description": "Progresso da meta" },
          { "id": "rel_parcelas", "title": "📋 Parcelas", "description": "Ativas e projeção de alívio" },
          { "id": "rel_evolucao", "title": "📈 Evolução 6 meses", "description": "Tendência geral" }
        ]
      }]
    }
  }
}
```

### 7.3 Resposta com Link de Relatório

```json
{
  "type": "text",
  "text": {
    "body": "📊 *Relatório Mensal — Março/2026*\n\n🔗 Acesse: https://finfamilia.app/r/a8f3k2m1\n\n🔒 Link privado · expira em 24h"
  }
}
```

---

## 8. Estrutura de Pastas (Next.js)

```
finfamilia/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + topbar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            # Dashboard principal
│   │   │   ├── orcamento/
│   │   │   │   └── page.tsx
│   │   │   ├── cartoes/
│   │   │   │   └── page.tsx
│   │   │   ├── parcelas/
│   │   │   │   └── page.tsx
│   │   │   ├── metas/
│   │   │   │   └── page.tsx
│   │   │   ├── transacoes/
│   │   │   │   └── page.tsx
│   │   │   └── configuracoes/
│   │   │       └── page.tsx
│   │   ├── r/
│   │   │   └── [token]/
│   │   │       └── page.tsx            # Relatório SSR por token
│   │   ├── api/
│   │   │   ├── reports/
│   │   │   │   └── generate/
│   │   │   │       └── route.ts
│   │   │   └── webhook/
│   │   │       └── whatsapp/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # Componentes base (cards, buttons, etc)
│   │   ├── charts/                     # Gráficos (donut, bars, timeline)
│   │   ├── dashboard/                  # Componentes do dashboard
│   │   ├── reports/                    # Templates de relatórios
│   │   │   ├── ReportMensal.tsx
│   │   │   ├── ReportComparativo.tsx
│   │   │   ├── ReportMeta.tsx
│   │   │   ├── ReportParcelas.tsx
│   │   │   ├── ReportCategoria.tsx
│   │   │   └── ReportEvolucao.tsx
│   │   └── layout/                     # Sidebar, topbar, etc
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Cliente browser
│   │   │   ├── server.ts               # Cliente server
│   │   │   └── queries.ts              # Queries reutilizáveis
│   │   ├── whatsapp/
│   │   │   ├── sender.ts               # Envio de mensagens
│   │   │   └── templates.ts            # Templates de mensagens
│   │   └── utils/
│   │       ├── formatters.ts           # Formatação de moeda, datas
│   │       └── categories.ts           # Regras de categorização
│   └── types/
│       └── index.ts                    # Types TypeScript
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_create_views.sql
│       ├── 003_create_functions.sql
│       └── 004_create_rls.sql
├── n8n/
│   └── workflows/
│       ├── wf01_menu_principal.json
│       ├── wf02_consulta_rapida.json
│       ├── wf03_registro_gasto.json
│       ├── wf04_relatorios.json
│       ├── wf05_alertas_cron.json
│       └── wf06_importacao_fatura.json
├── docker-compose.yml
├── .env.local
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

---

## 9. Configuração Docker

```yaml
# docker-compose.yml
version: '3.8'

services:
  nextjs:
    build: .
    ports:
      - "3000:3000"
    env_file: .env.local
    depends_on:
      - n8n
    restart: unless-stopped

  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASS}
      - WEBHOOK_URL=https://${DOMAIN}/webhooks/
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certbot:/etc/letsencrypt
    depends_on:
      - nextjs
      - n8n
    restart: unless-stopped

volumes:
  n8n_data:
```

---

## 10. Variáveis de Ambiente

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# WhatsApp Business API
WHATSAPP_TOKEN=EAAxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=finfamilia_verify_2026

# n8n
N8N_USER=admin
N8N_PASS=senha_segura

# App
NEXT_PUBLIC_APP_URL=https://finfamilia.app
DOMAIN=finfamilia.app
```

---

## 11. Categorias Padrão (seed)

| Emoji | Nome | Slug | Limite Mensal |
|---|---|---|---|
| 🚗 | Transporte | transporte | R$ 230,00 |
| 🍔 | iFood | ifood | R$ 200,00 |
| 🛒 | Mercado | mercado | R$ 900,00 |
| 🍽️ | Restaurante | restaurante | R$ 150,00 |
| 👗 | Roupas | roupas | R$ 300,00 |
| 💻 | Assinaturas | assinaturas | R$ 660,00 |
| 🏠 | Casa | casa | R$ 400,00 |
| 💊 | Saúde/Farmácia | saude | R$ 200,00 |
| 🎬 | Lazer | lazer | R$ 120,00 |
| 📚 | Educação | educacao | R$ 350,00 |
| 📱 | Telefonia | telefonia | R$ 70,00 |
| ⚡ | Energia | energia | R$ 370,00 |
| 🏋️ | Academia | academia | R$ 150,00 |
| 🔧 | Outros | outros | R$ 200,00 |

---

## 12. Regras de Categorização Automática (importação de fatura)

```typescript
const RULES: Record<string, string[]> = {
  transporte: ['UBER', '99*', 'DL *UberRides'],
  ifood: ['IFD*iFood', 'IFD *ZAMP'],
  mercado: ['ARMAZZEM', 'FORMOSA', 'ROCHA COMERCIO', 'MEIO A MEIO'],
  restaurante: ['BURGER KING', 'SPOLETO', 'FLY CAFE', 'PIRACEMA', 'PANIFICADORA'],
  roupas: ['RIACHUELO', 'C&A', 'AREZZO', 'SHEIN', 'SHOPEE', 'AMERICANAS'],
  assinaturas: ['CLAUDE.AI', 'SPOTIFY', 'NETFLIX', 'GOOGLE', 'TRELLO', 'HETZNER'],
  saude: ['DROGARIA', 'DROGARAIA', 'GROWTH'],
  lazer: ['CINESYSTEM', 'MALIBU BEACH'],
  energia: ['BMB *Equatorial'],
  telefonia: ['TIM*'],
  academia: ['BODYTEEN', 'BLUEFIT'],
  educacao: ['TEC CONCURSOS', 'CONCURSOS INTELIGE'],
};
```

---

## 13. Fases de Desenvolvimento

### Fase 1 — MVP (2 semanas)

- [ ] Setup Supabase: tabelas, views, functions, RLS
- [ ] Setup Next.js com Tailwind + Supabase Auth
- [ ] Dashboard principal com KPIs e gráfico de categorias
- [ ] Página de transações com filtros
- [ ] 1 template de relatório (mensal) com SSR por token
- [ ] Setup n8n com WF01 (menu principal) + WF03 (registro de gasto)

### Fase 2 — Relatórios + Parcelas (1 semana)

- [ ] Todos os 6 templates de relatórios
- [ ] Página de parcelas com timeline de alívio
- [ ] Página de metas com progresso
- [ ] WF04 (submenu relatórios com geração de URL)
- [ ] WF02 (consulta rápida inline no WhatsApp)

### Fase 3 — Alertas + Import (1 semana)

- [ ] WF05 (alertas automáticos CRON)
- [ ] WF06 (importação de fatura PDF)
- [ ] Página de orçamento com edição de limites
- [ ] Página de configurações (categorias, membros)

### Fase 4 — Polish (1 semana)

- [ ] Gráficos interativos (Recharts)
- [ ] Responsividade mobile do dashboard
- [ ] Testes de fluxo WhatsApp end-to-end
- [ ] Deploy em produção (Hetzner + Docker)
- [ ] DNS + SSL + domínio

---

## 14. Métricas de Sucesso

| Métrica | Meta |
|---|---|
| Gastos registrados via WhatsApp/semana | > 15 |
| Tempo para registrar um gasto | < 30 segundos |
| Relatórios gerados/mês | > 8 |
| Categorias dentro do limite | > 80% |
| Reserva do bebê em Dez/2026 | > R$ 20.000 |
| Tokens de IA consumidos por relatório | 0 |

---

## 15. Considerações Futuras (pós-MVP)

- **Multi-família:** permitir que o mesmo sistema atenda mais de uma família (SaaS)
- **OCR de fatura:** usar Vision API para extrair dados de faturas por foto do WhatsApp
- **Integração bancária:** Open Finance para importação automática
- **Notificações push:** alertas no dashboard além do WhatsApp
- **Export PDF:** gerar PDF dos relatórios para compartilhamento offline
- **Modo SaaS:** cobrança por família, onboarding self-service
