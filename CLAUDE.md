# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral do projeto

Site de portfólio pessoal com estética minimalista inspirada no design system do iOS 26 (glassmorphism sutil, transições fluidas, profundidade). O site alterna entre três visualizações de projetos:

- `/design` — projetos de design
- `/code` — projetos de programação
- `/all` — união automática dos dois portfólios (não é uma curadoria separada; sempre reflete o que existe em `/design` + `/code`)

Cada projeto é exibido em um grid de módulos estilo Netflix (hover expande o card em escala) e, ao ser clicado, abre em um modal com detalhes — capa, banner, galeria de imagens e links dinâmicos (site ao vivo, GitHub, Vercel, Instagram, ebook etc., dependendo do que fizer sentido para aquele projeto específico).

Existe uma área de admin protegida (uso exclusivo do dono do site) para CRUD completo de projetos, incluindo reordenação manual via drag-and-drop.

O site é bilíngue (PT/EN) desde o início.

## Stack técnica

- **Framework**: Next.js (App Router)
- **Linguagem**: TypeScript (`strict: true`)
- **Estilização**: Tailwind CSS
- **Animações**: Framer Motion (usar `layoutId` para a transição card → modal)
- **Backend/Dados**: Supabase (Postgres + Storage + Auth)
- **Deploy**: Vercel
- **Tipografia**: Geist (fonte da própria Vercel, próxima da SF Pro)
- **Tema**: `next-themes` para dark/light mode com toggle
- **i18n**: `next-intl` (rotas com prefixo de idioma, ex: `/pt/design`, `/en/design`)
- **Lint/Format**: ESLint (`eslint-config-next`) + Prettier configurados desde o commit inicial
- **Reordenação no admin**: `dnd-kit`

> Ajustar aqui se alguma lib específica não estiver disponível ou surgir algo melhor durante o desenvolvimento — mas manter o espírito da stack (Next + Supabase + Vercel).

## Arquitetura de rotas

Usar o padrão de **intercepting + parallel routes** do App Router para o comportamento de modal com URL própria — o mesmo mecanismo usado por Instagram/Netflix:

- Ao clicar em um card a partir do grid → abre como modal por cima da grid, sem perder scroll/contexto. URL muda para `/[locale]/design/[slug]` (ou `/code/[slug]`, `/all/[slug]`).
- Ao acessar essa URL diretamente (link compartilhado, refresh, bot de SEO) → renderiza como página completa, sem modal, com metadata/Open Graph próprios daquele projeto.

Estrutura de pastas sugerida (ajustar durante implementação):
app/
[locale]/
design/
page.tsx
[slug]/
page.tsx # página completa (acesso direto)
@modal/
(.)[slug]/
page.tsx # intercepting route (modal)
code/
... (mesma estrutura)
all/
... (mesma estrutura, dados = união de design + code)
admin/
page.tsx # dashboard (protegido)
projects/
new/
[id]/edit/

## Modelo de dados (Supabase)

Rascunho do schema — ajustar conforme necessário na implementação:

**`projects`**

- `id`
- `title_pt`, `title_en`
- `description_pt`, `description_en`
- `slug`
- `type` (`design` | `code`)
- `cover_image_url`
- `banner_image_url`
- `position` (int, para ordenação manual)
- `created_at`, `updated_at`

**`project_images`** (galeria, 1:N com `projects`)

- `id`, `project_id`, `image_url`, `position`

**`project_links`** (links dinâmicos, 1:N com `projects`)

- `id`, `project_id`, `label`, `url`, `type` (ex: `github`, `vercel`, `live_site`, `instagram`, `ebook`, `other`)

**`tags`** e **`project_tags`** (N:N)

- `tags`: `id`, `name_pt`, `name_en`
- `project_tags`: `project_id`, `tag_id`

> `/all` não é uma tabela própria — é sempre a query de `projects` sem filtro de `type`.

## Admin

- Autenticação via Supabase Auth, restrita a uma única conta (o dono do site).
- CRUD completo: criar, editar, excluir e reordenar projetos (drag-and-drop, atualizando `position`).
- Ao criar/editar um projeto, o admin define: tipo (design/code), capa, banner, galeria, tags e links — os links são uma lista dinâmica (adicionar quantos forem necessários, escolhendo label/tipo + URL), não campos fixos.
- Toda rota `/admin/*` deve ser protegida por middleware — nunca renderizar nada de admin no lado do cliente sem checagem de sessão no servidor.

## Identidade visual

- Minimalista, inspirado no iOS 26: glassmorphism sutil (blur, transparência leve), cantos arredondados generosos, espaçamento generoso, transições suaves.
- Dark e light mode com toggle, sem flash de tema incorreto no load (usar `next-themes` corretamente com `suppressHydrationWarning`).
- Tipografia: Geist.
- Hover no grid expande o módulo em escala (não é só um zoom de imagem — o card cresce e ganha profundidade/sombra).
- Mobile: hover não existe em touch — pensar em um comportamento equivalente (tap simples já leva ao detalhe, sem etapa intermediária de "hover").

## Convenções de código

- TypeScript estrito. Evitar `any`.
- Componentes em `PascalCase`, hooks em `camelCase` com prefixo `use`.
- Preferir Server Components por padrão; usar `"use client"` apenas quando necessário (interatividade, hooks de estado, Framer Motion).
- Variáveis de ambiente sensíveis (chaves do Supabase) nunca hardcoded — sempre via `.env.local` e `process.env`.
- Commits e nomes de branch em inglês; conteúdo do site em PT/EN conforme o campo.

## O que NÃO fazer

- Não criar tabelas ou campos fixos por tipo de link (ex: coluna `github_url`, `instagram_url` separadas) — usar a tabela `project_links` dinâmica.
- Não tratar `/all` como uma fonte de dados separada — é sempre a união de `design` + `code`.
- Não renderizar dados de admin sem checagem de autenticação no servidor.
- Não commitar chaves do Supabase ou segredos no repositório.

## Desenvolvimento: Comandos e Setup

### Scripts principais

```bash
npm run dev          # dev server (com --webpack, Turbopack tem bug de routing)
npm run build        # production build
npm run start        # run production build local
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (strict mode)
npm run format       # Prettier (escreve arquivos)
```

### Primeiros passos

1. Copiar `.env.example` → `.env.local` e preencher credenciais do Supabase
2. `npm install`
3. `npm run dev` → [http://localhost:3000](http://localhost:3000)

> **Nota importante:** `npm run dev` força `--webpack` (em vez do Turbopack padrão) por causa de um bug reproduzível no Turbopack ao resolver interception routes com a estrutura `[locale]` + múltiplas rotas interceptadas no mesmo slot `@modal`. Confirmado que **não afeta production** (`next build && next start`). Revisar quando Turbopack for atualizado.

## Arquitetura de dados e rotas

### Padrão: Intercepting Routes + Parallel Routes (Instagram/Netflix-style)

Toda rota `/[locale]/[seção]/[slug]` existe em **dois lugares**:
- **`app/[locale]/[seção]/[slug]/page.tsx`** — renderiza a página completa (acesso direto via URL compartilhada, SEO, refresh)
- **`app/[locale]/@modal/[seção]/(.)[slug]/page.tsx`** — mesmo conteúdo, mas como modal por cima do grid (clique no card, preserva scroll/contexto)

Ambas compartilham `layoutId` via Framer Motion → transição suave card → modal. A rota modal usa `next/navigation` → `router.back()` ao fechar, levando volta ao grid.

### Fluxo de dados

```
App Router (layout.tsx) renderiza:
  - {children}       → grid da seção (design/code/all)
  - {modal}          → slot parallel route, intercepta cliques
```

Nenhum client-side routing — tudo é Next.js routing nativo. `getProjectBySlug` é cached com `React.cache` → mesmo projeto é fetched uma única vez por request, quer seja renderizado na página ou no modal.

### Exemplo: Adicionar um novo link type

1. **Schema (Supabase):** nova migration que altera o enum `link_type`:
   ```sql
   alter type public.link_type add value 'new_type' after 'other';
   ```
   (sem DROP/RECREATE — Postgres permite adicionar ao enum)

2. **Tipo TypeScript (`lib/types.ts`):** atualizar `type LinkType = 'github' | 'vercel' | ... | 'new_type'`

3. **i18n (`messages/pt.json`, `messages/en.json`):** adicionar chave em `Links` → `"new_type": "Rótulo"`

4. **Form admin (`components/admin/LinksEditor.tsx`):** tipo é dropdown automático a partir do type, não precisa mudar

5. **Renderização pública (`ProjectDetail.tsx`):** link é renderizado dinamicamente, nenhuma mudança necessária

**Não há colunas fixas** no `projects` — tudo vai por `project_links`, que é 1:N e flexível.

## Server Actions e Validação

### Padrão de Server Action (Projects, Hero Slides, Tags)

Localizado em `lib/actions/[feature].ts`, segue um padrão consistente:

1. **Validação (Zod):** em `lib/validation/[feature].ts` (ex: `projectFieldsSchema`)
2. **Action com `useActionState`:**
   ```typescript
   export async function createProject(locale: AppLocale, prevState, formData) {
     // parse + validate com zod
     // supabase.from('projects').insert(...)
     // revalidate paths
     // redirect ou return error
   }
   ```
3. **Componentes usam `useActionState`** (client) + `formAction` prop
4. **Erros são returned como `{ error: string }`** — UI mostra no form

Não usamos `server-only` porque a maioria dos patterns já é server-safe por natureza (Server Actions rodam no servidor).

### Uploads de mídia (Supabase Storage)

Padrão em `lib/actions/hero-slides.ts` (reutilizar como template):

```typescript
async function uploadMedia(supabase, pathPrefix, file) {
  const path = `hero/${pathPrefix}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('project-media')
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage
    .from('project-media')
    .getPublicUrl(path).data.publicUrl;
}
```

**Prefixo de caminho:** `'new'` ao criar (depois renomear se precisar), `String(id)` ao editar.

Cleanup ao deletar: usar `createServiceRoleClient()` (chave service-role do env) para `remove()` sem checar RLS.

## Row Level Security (RLS)

Autenticação verdadeira: RLS policies em `proxy.ts` (middleware) **e** novamente nos dados (defense-in-depth).

**Admin email:** hardcoded em `proxy.ts` e no RLS da tabela. Muda via `.env` → `ADMIN_EMAIL`.

Todas as policies checam:
```sql
(select auth.jwt() ->> 'email') = 'dudu.delazeri@gmail.com'
```

Isso significa: **não há backdoor via API direta** — admin RLS é o escudo principal, não uma camada de UI.

## Estrutura de componentes

### Server vs Client (prefer Server Components)

- **Server:** `ProjectCard`, `ProjectDetail`, `ProjectGallery` (leem dados)
- **Client:** `Modal` (Framer Motion, state, keyboard events), `ProjectForm` (useActionState, form inputs), `HeroCarousel` (animações)

Marcar `'use client'` apenas quando:
- precisa de hooks (`useState`, `useActionState`, `useRouter`)
- precisa de Framer Motion (shared layoutId)
- precisa de event listeners (keyboard, intersection)

### Localizações (i18n)

Use `pickLocale(pt, en, locale)` para renderizar o texto certo. Componentes Server usam `getLocale()`, componentes Client usam `useLocale()`.

Fallback automático: se `titleEn` estiver vazio, pode fallback pra `titlePt`.

## Tags: Topic vs Tool

**Topic tags** (seção, ex: "UI Design", "React"):
- Criação inline no formulário de projeto (sem biblioteca prévia)
- Renderizadas como pills de texto

**Tool tags** (ferramentas, ex: "Figma", "TypeScript"):
- Biblioteca pré-cadastrada em `/admin/tools` com upload de ícone (`icon_url`)
- Seleção (toggle) no formulário de projeto, sem criação inline
- Renderizadas como ícones apenas (sem texto ao lado)

Schema: single `tags` table com coluna `category` (`'topic'` | `'tool'`), `icon_url` nullable.

## Debugging Notes

- **Dev server com webpack:** atalhos Turbopack não funcionam, use ESC para sair ou mudar `next.config.js`
- **Migrations:** aplicar via Supabase CLI local (`supabase migration up`) ou MCP (`apply_migration`)
- **RLS pode bloquear queries:** se uma query admin retorna vazio, checklist de RLS policies
- **Next 16 interception routes:** se modalão não abre, checklist: `(@modal/...)` tem `(.)[slug]/page.tsx`? Slug param está correto?
