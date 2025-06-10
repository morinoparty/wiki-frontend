# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server with Turbopack (auto-runs panda codegen)
- `pnpm build` - Production build (includes license generation and search indexing)
- `pnpm lint` - Run ESLint
- `pnpm prepare` - Generate Panda CSS (run after adding new styles)

### Deployment
- `pnpm deploy` - Full deployment to Cloudflare Workers via OpenNext
- `pnpm preview` - Preview build locally
- `pnpm upload` - Upload build to Cloudflare

### Utilities
- `pnpm index` - Generate search index for posts
- `pnpm generate:license` - Generate license information
- `pnpm cf-typegen` - Generate Cloudflare types

## Architecture

### Core Structure
This is a Next.js 15 Wiki application using App Router with GitHub as the CMS backend. Content is stored in a separate GitHub repository (`morinoparty/wiki-contentdev`) with the following structure:
- `/content/wiki/` - Markdown articles
- `/content/categories/` - Category definitions  
- `/content/img/` - Image assets
- `/content/users/` - User information

### Key Technologies
- **Next.js 15** with App Router and React Server Components
- **Chakra UI + Panda CSS** for styling system
- **OpenNext** for Cloudflare Workers deployment
- **GitHub API (Octokit)** for content management
- **NextAuth.js** for authentication
- **MDX Editor** for content editing
- **FlexSearch** for client-side search

### Application Layers

#### Server Actions (`src/actions/`)
The primary API layer using Next.js Server Actions. All data operations go through these functions:
- **Core**: `createPost`, `updatePost`, `deletePost`, `lockPost`, `changePostStatus`
- **Query**: `getAllPosts`, `getPost`, `searchPosts`, `getUserPosts`
- **Batch**: `batchDeletePosts`, `batchChangePostsStatus`, `duplicatePost`
- **History**: `getPostHistory`, `restorePostVersion`, `getPostDiff`

All actions return `ApiResult<T>` with consistent error handling.

#### Services (`src/actions/services/`)
- **GitHubService**: Handles all GitHub API interactions and content management
- **AuthService**: User authentication and session management
- **PermissionService**: Role-based access control (admin/editor/viewer)
- **ValidationService**: Input validation using Zod schemas

#### App Router Structure (`src/app/`)
- `(normal)/` - Public-facing pages
- `(dashboard)/` - Admin interface with post management
- `@modal/` - Parallel routes for modal dialogs
- `api/auth/` - NextAuth.js authentication endpoints

#### Components (`src/components/`)
React components using Panda CSS styling. Key components:
- **Editor.tsx** - MDX content editor
- **PostBody.tsx** - Markdown content renderer
- **Sidebar.tsx** - Navigation and category filtering
- **AuthConditional.tsx** - Conditional rendering based on auth state

#### Styling (`src/theme/`)
Comprehensive Panda CSS theme system with:
- Custom color tokens and semantic tokens
- Component recipes and slot recipes
- Text styles and responsive breakpoints
- Theme configuration in `panda.config.ts`

### Content Management Flow
1. Users create/edit posts through the web interface
2. Server Actions validate and process the content
3. GitHubService commits changes to the content repository
4. Content is automatically deployed to Cloudflare Workers
5. Static assets are served from the deployed content

### Authentication & Permissions
- NextAuth.js with custom providers
- Three-tier permission system: admin/editor/viewer
- Post-level visibility controls: public/private/restricted
- GitHub integration for commit attribution

### Development Patterns
- Use Server Actions for all data operations, avoid API routes
- Components should use Panda CSS `sva` function for styling
- Follow the existing theme token system in `src/theme/`
- Keep components pure and extract logic to custom hooks
- Use TypeScript strictly with Zod schemas for validation

### Environment Variables Required
```
GITHUB_TOKEN - GitHub API access token
ADMIN_USERS - Comma-separated list of admin user IDs
MAIN_SERVER_URL - Authentication server URL
CLIENT_ID - OAuth client ID
AUTH_URL - Application auth URL
AUTH_SECRET - NextAuth.js secret
```