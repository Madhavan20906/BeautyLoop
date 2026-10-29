# BeautyLoop

BeautyLoop helps online beauty shoppers compare sourced product information and, once connected, use skin insight and virtual try-on in one decision journey.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Web app: `artifacts/beautyloop`
- Shared API routes and catalog data: `artifacts/api-server/src`
- API contract: `lib/api-spec/openapi.yaml`
- Generated client hooks: `lib/api-client-react/src/generated`

## Architecture decisions

- Product comparison uses only shopper-selected preferences and manufacturer-listed attributes; it does not infer treatment effectiveness from skin measurements.
- Skin analysis and virtual try-on must remain visibly unavailable until real YouCam requests are verified. Never substitute fabricated results.
- Product facts and prices include manufacturer sources and observation dates; unknown details stay explicit.

## Product

The first build supports a sourced skincare catalog, budget/category/preference-based comparison, and a shareable product decision summary. Skin analysis and virtual try-on are planned for server-side YouCam integration once the account API details are supplied and verified.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

Re-check listed prices against the source before relying on them; catalog prices are time-stamped observations, not live retailer inventory.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
