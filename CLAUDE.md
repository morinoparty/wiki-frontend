# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use pnpm (never npm / npx; use `pnpm exec` / `pnpm dlx`). Node.js 26.12+, pnpm 12.

- `pnpm install` - Install dependencies (runs `panda codegen` via `prepare`)
- `pnpm run dev` - Generate license list + search index, then `cf dev`
- `pnpm run build` - Generate, then `cf build --mode production` (Vite + vinext, output in `.cloudflare/output`)
- `pnpm run typecheck` - `cf workers types && tsc --noEmit`
- `pnpm run generate` - `generate:license` + `generate:index` (must run before `cf build`; `cf` does not run package scripts)
- `pnpm exec cf deploy --dry-run` - Validate a deploy without credentials

Never run `cf dev` / `cf build` / `cf deploy` in a directory without `cloudflare.config.ts`.
Deploys normally happen from `.github/workflows/deploy.yml` on push to main.

## Architecture

A Next.js App Router application built with **vinext** (Next.js API on Vite) and
deployed to Cloudflare Workers as Worker `wiki-frontend` (workers.dev only) with the
`cf` CLI. The `next` package is not installed; vinext provides `next/*` and its types
(`src/vinext-env.d.ts`). Worker settings and bindings live in `cloudflare.config.ts`.

Content lives in a separate repository (`morinoparty/wiki-content`) in the hagaki content format:
- `/content/article/<uuid>/index.mdx` - article body (frontmatter + MDX)
- `/content/article/<uuid>/assets/<imageId>.avif` - images owned by that article
- `/content/categories/<slug>.json` - category definitions

Paths are uuid-based because a slug can change. Reads go through the deployed
copy at `CONTENT_BASE_URL` (`src/lib/content.ts`, Worker `wiki-content` on workers.dev;
manifests: `article.json`, `slug-index.json`, per-article `info.json`); writes are
commits to the repository via hagaki (`src/lib/hagaki.ts`, server only).

### Key Technologies
- **vinext** + Vite 8 + `@cloudflare/vite-plugin` (v2 beta) + `cf`
- **chlorophyll + Panda CSS** for styling (`colorPalette: mori`)
- **hagaki** for content reads/writes, the editor, and in-browser image encoding
- **better-auth** (DB-less, generic OAuth against MineAuth)
- **FlexSearch** for client-side search (`public/search-index.json`, generated at build)

### Environment
Read Worker env through `getEnv()` (`src/lib/env.ts`): `cloudflare:workers` on workerd,
`process.env` in Node scripts.
- `CLIENT_ID` - plain var in `cloudflare.config.ts`
- `AUTH_SECRET`, `SERVER_URL`, `HAGAKI_GITHUB_TOKEN` - Worker secrets
  (`bindings.secret()`; local values from `.env`, deploy via `cf deploy --secrets-file`)
- MineAuth server: `src/lib/server-list.ts` fetches `${SERVER_URL}servers` and uses the first
  server whose `/.well-known/openid-configuration` responds (`getAuthServerUrl()`, cached 60s
  per isolate). Use `getServerUrl(server)` for a specific server; never hardcode a server URL.
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` - for the `cf` CLI only (`.env` / GitHub secrets)

### Application Layers
- `src/actions/` - Server Actions (`createPost`, `updatePost`, history, `getPostForEdit`).
  All return `ApiResult<T>`. See `src/actions/README.md`.
- `src/actions/services/` - `GitHubService` (hagaki wrapper), `AuthService`,
  `PermissionService`, `ValidationService` (Zod), `post-images` (uploaded image checks)
- `src/app/` - `(normal)/` public pages, `(dashboard)/` editor, `@modal/` parallel routes,
  `api/auth/` (better-auth), `api/article-assets/` (committed images, CDN or repo)
- `src/proxy.ts` - redirects `/dashboard` to sign-in when there is no session cookie

### Editor images
Images inserted in the editor are encoded to AVIF in the browser and kept in memory
(`hagaki/pending-images`); nothing is uploaded until save. On save the client sends the
blobs as `FormData` (third argument of `updatePost`) and they land in the same commit as
the body. The request limit is `SAVE_REQUEST_LIMIT_BYTES` (`src/lib/post-images.ts`,
also `serverActions.bodySizeLimit` in `next.config.ts`).

### Development Patterns
- Use Server Actions for data operations; route handlers only where raw bytes are needed
- Style with Panda CSS (`sva` / `css`) and chlorophyll components
- Keep client components free of server-only imports (`@/lib/hagaki`, `@/lib/env`)
- Use TypeScript strictly with Zod schemas for validation
