# Repository Guidelines

## Project Structure & Module Organization
- `src/index.ts` boots the MCP server and registers tools; keep new exports centralized here.
- `src/tools/*.ts` house tool implementations grouped by domain (agent, knowledge, outbound calling, batch jobs, phone numbers, utility).
- `src/schemas/*.ts` contain Zod schemas for request/response validation; add or extend schemas before wiring new tools.
- `src/services/elevenlabs-api.ts` wraps ElevenLabs HTTP calls; `src/services/formatters.ts` normalizes responses; `src/utils/*` holds shared helpers.
- `dist/` stores compiled JS; edit TypeScript in `src/` and rebuild instead of touching `dist/`.

## Build, Test, and Development Commands
- `npm run dev` — run the server in watch mode via `tsx` for rapid iteration.
- `npm run build` — type-check and emit JS to `dist/` using `tsc`.
- `npm start` — run the compiled server (requires a fresh build).
- `npm run clean` — remove `dist/` artifacts before fresh builds.
- `npm test` — currently a stub; replace with real tests when added.
- Set `ELEVENLABS_API_KEY` in `.env` (not committed) before running any command.

## Coding Style & Naming Conventions
- TypeScript ES modules, 2-space indentation, prefer explicit return types and narrow Zod schemas.
- Tool identifiers follow the existing snake_case `elevenlabs_*` pattern to match client expectations; keep filenames descriptive (`outbound-tools.ts`, etc.).
- Favor small, single-purpose helpers in `utils/` and reuse shared error handling patterns from `utils/error-handlers.ts`.
- Keep public schemas and tool definitions colocated; avoid implicit `any` and keep imports relative within `src/`.

## Testing Guidelines
- No active test suite yet; when adding tests, keep them near sources (e.g., `src/tools/__tests__/`) and align names with the tool or schema under test.
- Aim for request/response fixture coverage around new schemas and integration smoke tests for ElevenLabs API calls (use mocked HTTP).
- Update `npm test` to run the chosen framework once added (Vitest/Jest are common fits for TS).

## Commit & Pull Request Guidelines
- Use concise, imperative commit subjects tied to scope (e.g., `Add batch call schema validation`, `Fix phone-number tool error handling`).
- For PRs, include: summary of changes, commands run (`npm run build`, tests), any new env vars/config, and sample tool payloads/responses when behavior changes.
- Avoid committing compiled `dist/` outputs or `.env`; prefer rebasing small topic branches for review clarity.

## Security & Configuration Tips
- Keep `ELEVENLABS_API_KEY` and any Twilio credentials in local `.env`; never log secrets.
- When wiring into Claude Desktop, use absolute paths to `dist/index.js` and confirm Node 18+.
- If adding new tools, document required permissions and expected side effects in the tool description so clients can surface them clearly.
