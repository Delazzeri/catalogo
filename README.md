<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:6366f1,100:06b6d4&height=190&section=header&text=Cat%C3%A1logo&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=Portf%C3%B3lio%20de%20design%20e%20c%C3%B3digo%20com%20painel%20admin%20pr%C3%B3prio&descSize=17&descAlignY=60" alt="Catálogo" />

<img src="https://skillicons.dev/icons?i=nextjs,ts,tailwind,supabase,vercel&theme=dark" height="42" alt="Stack" />

<br/><br/>

<a href="https://portfolio-delazzeris-projects.vercel.app"><img src="https://raw.githubusercontent.com/Delazzeri/Delazzeri/main/assets/btn-demo.svg" height="36" alt="Ver site" /></a>

</div>

<br/>

## Sobre

Site de portfólio para mostrar projetos de **design** e de **programação** com a sensação de um app nativo: grid de cards no estilo Netflix, detalhe em modal com URL compartilhável e um **painel administrativo próprio**, sem CMS headless nem dashboard de terceiros. O visual é minimalista, com glassmorphism sutil inspirado no iOS 26.

## Funcionalidades

- **Três visões, uma fonte de dados.** `/design` e `/code` são consultas filtradas. `/all` nunca é uma curadoria separada: é sempre a união das duas, na mesma ordem global.
- **Bilíngue (PT/EN)** em todas as rotas, com fallback por idioma para campos deixados em branco.
- **Tema claro e escuro** sem flash do tema errado no carregamento.
- **Interação adaptada ao toque.** O efeito de hover do grid no desktop vira toque direto para o detalhe no celular.
- **Carrossel de destaques** na home, gerenciado pelo admin.
- **PDF por projeto**, aberto num visualizador dentro do próprio site.
- **Ferramentas e tópicos como tags.** As ferramentas (Figma, TypeScript...) vêm de uma biblioteca com ícone próprio, e os tópicos são tags livres.
- **Painel admin completo:** criar, editar e excluir projetos, enviar capa, galeria e PDF para o Supabase Storage, gerenciar tags e links, e reordenar projetos arrastando.
- **SEO básico:** metadados e imagem de compartilhamento por projeto, `sitemap.xml` e `robots.txt`.

## Destaques técnicos

- **Intercepting + parallel routes.** Clicar num card abre um modal sobre o grid, com URL própria (`/design/[slug]`). Abrir essa URL direto (link compartilhado, atualização da página, buscador) renderiza a mesma página completa, com metadados próprios. Card e modal compartilham um `layoutId`, e o Framer Motion anima a transição entre eles.
- **i18n na estrutura de rotas.** Todas as rotas têm prefixo de idioma (`/pt/...`, `/en/...`) via `next-intl`, desde o início.
- **RLS como autorização de fato.** A política de escrita de cada tabela confere o JWT com o e-mail do administrador. O `proxy.ts` e o layout do painel reforçam a checagem no servidor, como camadas extras.
- **Schema sem "uma coluna por funcionalidade".** Os links de um projeto (GitHub, site, Instagram, ebook...) ficam na tabela dinâmica `project_links`. Um novo tipo de link é um dado, não uma migration.
- **Bug do Turbopack documentado.** O servidor de desenvolvimento do Next 16 falha com esta estrutura de rotas (`[locale]` com várias rotas interceptadas irmãs). O build de produção não é afetado. Por isso o `npm run dev` usa `--webpack`.

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components por padrão) |
| Linguagem | TypeScript em modo `strict` |
| Estilo | Tailwind CSS v4 |
| Animação | Framer Motion |
| Dados e autenticação | Supabase (Postgres, RLS, Storage, Auth) |
| Interação | dnd-kit |
| Internacionalização | next-intl |
| Validação | Zod |
| Visualização de PDF | pdf.js |
| Deploy | Vercel |

## Estrutura

```
app/[locale]/
  design/ · code/ · all/       # grid e página completa de cada projeto
  @modal/                      # rotas interceptadas: detalhe em modal
  admin/
    login/
    (dashboard)/               # área protegida
      projects/                # CRUD de projetos
      hero/                    # slides do carrossel
      tools/                   # biblioteca de ferramentas
components/                    # UI pública e componentes do admin
lib/actions/                   # Server Actions
lib/data/                      # consultas ao Supabase
supabase/migrations/           # schema, RLS e evolução do banco
```

## Modelo de dados

- **`projects`**: título e descrição em PT e EN, `slug`, `type` (`design` ou `code`), capa, PDF opcional, `published` e `position` para a ordem manual.
- **`project_images`**: galeria do projeto (1:N).
- **`project_links`**: links dinâmicos do projeto (1:N).
- **`tags`** e **`project_tags`**: tags do tipo tópico ou ferramenta (N:N).
- **`hero_slides`**: slides do carrossel da home.

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha o `.env.local` com as credenciais do seu projeto Supabase:

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` | acesso público ao Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | somente servidor, nunca exponha no cliente |
| `DATABASE_PASSWORD` | usada só pelas ferramentas da CLI do Supabase |
| `ADMIN_EMAIL` | e-mail da única conta com acesso ao `/admin` |
| `NEXT_PUBLIC_SITE_URL` | URL pública, usada em metadados, sitemap e OG |

As migrations ficam em `supabase/migrations/`. Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Ação |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento (com `--webpack`) |
| `npm run build` / `npm run start` | build de produção e servidor |
| `npm run lint` | ESLint |
| `npm run typecheck` | verificação de tipos com `tsc` |
| `npm run format` | Prettier |

Decisões de arquitetura e justificativas completas estão em [CLAUDE.md](./CLAUDE.md).
