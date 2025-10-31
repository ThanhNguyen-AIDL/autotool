# Autotool Feature Overview

This document captures the functional surface area of the project so future reviews do not require rereading the entire codebase.

## High-Level Modules
- **Puppeteer automation**: `automation/` launches Chrome profiles, logs into CoinMarketCap and Sosovalue, posts content, and tears down suspended profiles.
- **Express API**: `server.js` exposes REST endpoints for profile CRUD, prompt/category management, content generation, cooldown control, log access, and task triggers.
- **Next.js admin UI**: `clientapp/` provides management dashboards for profiles, prompts, cooldowns, task automation, and log viewing.
- **Persistence layer**: Sequelize models in `models/` back PostgreSQL tables created by the SQL migrations in `sql/`.

## Key Workflows
1. **Content authoring**
   - Prompts are grouped by category (`prompt_categories`, `prompt_inputs`).
   - `POST /api/content` calls GitHub Models (`gpt-4.1-mini`) for short-form copy.

2. **Automated posting**
   - Task Manager (UI) cycles through selected categories.
   - Cooldowns (`cooldown_states`) gate execution per PC/category (default 30 minutes).
   - `POST /api/task/postcmc` posts to CoinMarketCap with optional tag and image.
   - `POST /api/task/postssl` posts to Sosovalue TokenBar with optional title/image.

3. **Profile lifecycle**
   - Profiles (stored in `emails`) are fetched per owner; suspended accounts are removed.
   - Launch actions spin up Chrome with persisted `userDataDir`.

4. **Logging & monitoring**
   - Pino writes daily log files to `/logs`.
   - `/api/logs` offers file discovery and paginated viewing in the UI.

## Operational Notes
- Environment variables: database credentials plus `GITHUB_TOKEN` for the GitHub Models API.
- Migrations: run `sql/V2.0__` through `V6.0__`, or execute `node scripts/run-ssl-migration.js`.
- Default cooldown: 1800 seconds—adjust via the Cooldown manager UI for faster cadences.
