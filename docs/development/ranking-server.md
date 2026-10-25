# Persistent frontier ranking

## Current status

The local Vite server serves GET/POST /api/rankings and stores results in .data/rankings.sqlite, outside dist. The API was checked over HTTP, and a separate isolated production-process check verifies persistence after restart. It does not insert test players in the live database.

The Worker API is deployed at https://sunset-survivors-ranking.rickeletro.workers.dev/api/rankings. It is connected to the remote sunset-survivors D1 database (313d4e66-0b50-4ecb-9432-1e4626872d2d) as RANKING_DB and to the RANKING_WRITES rate limiter (namespace 41981, 120 writes/60 seconds). ALLOWED_ORIGINS permits https://rickeletro.github.io and http://localhost:3000. The rankings table and ranking_score index were previously verified against sqlite_master.

Live verification confirmed GET 200 with the GitHub Pages CORS header, OPTIONS 204, POST 400 for an empty batch (after passing the rate limiter), and rejection of another origin with 403. No fake scores were inserted in the production board. Valid batch insertion/idempotence remains covered by the automated database/Worker tests rather than by adding test players to production.

Production game builds now default to the live Worker URL. VITE_RANKING_API_URL remains an optional override; development still uses the local Vite/Node API by default. The Pages workflow already reads the optional repository variable and uses Node 24. The updated game must still be published to GitHub Pages: remote Worker publication does not publish local uncommitted frontend changes.

## Future backend deployment or recovery

Keep the game on its existing static host. Deploy the ranking Worker separately, with a persistent D1 binding. No private API token goes into the game bundle. The Worker uses prepared statements, atomic batches, unique run IDs, bounded payloads, server-side score calculation, exact-origin CORS and a write rate-limiter binding.

1. Authenticate Wrangler in the account that will own the ranking:

   ```sh
   npx wrangler login
   npx wrangler d1 list
   ```

2. The existing sunset-survivors database ID is already set in server/cloudflare/wrangler.toml; do not create a duplicate database. ALLOWED_ORIGINS already includes https://rickeletro.github.io. Do not append /sunset-survivors/: CORS uses the origin, not the repository path. Keep localhost only if remote-backend development is desired. The rate-limit namespace ID must be unique to this binding in that account.

3. Apply the non-destructive schema and deploy:

   ```sh
   npx wrangler d1 migrations apply sunset-survivors --remote --config server/cloudflare/wrangler.toml
   npx wrangler deploy --config server/cloudflare/wrangler.toml
   ```

4. For a replacement backend URL, optionally set VITE_RANKING_API_URL in GitHub Settings → Secrets and variables → Actions → Variables. It is not required for the current deployed Worker:

   ```text
   VITE_RANKING_API_URL=https://sunset-survivors-ranking.rickeletro.workers.dev/api/rankings
   ```

   Publish the updated frontend through the existing Deploy to GitHub Pages workflow. If changing the optional variable, rerun the workflow to build it into the bundle. For a host that only accepts uploaded files, set that variable in .env.production.local before building locally. This is a build-time setting; editing environment variables after uploading dist does not rewrite the bundle.

5. Confirm GET and POST from the actual game's origin, not only localhost. Configure D1 backup/restore/export operations in the owning Cloudflare account. A new frontend deployment never drops or reinitializes the D1 table.

References checked against the official [D1 Worker API](https://developers.cloudflare.com/d1/worker-api/d1-database/), [D1 getting started](https://developers.cloudflare.com/d1/get-started/) and [Worker rate-limit bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/). D1-compatible SQL and HTTP/CORS behavior are covered by automated tests with a SQLite adapter; those tests do not claim a remote Cloudflare deployment or runtime certification.

## Local development and optional Node hosting

Use Node 24 (the runtime used for verification), or Node >=22.13 with node:sqlite support. npm run dev and npm run preview install the API automatically. The database opens lazily on the first request. Rebuilds and server restarts retain results. RANKING_DB_PATH can select an absolute persistent path. The environment template documents the options; export process variables when running the Node server.

For an optional Node production host:

```sh
npm run build
npm start
```

Use an absolute RANKING_DB_PATH on persistent storage if running the optional Node production server. This route is not required by the chosen static-host setup.

Back up a live local/Node database consistently:

```sh
npm run ranking:backup -- /absolute/persistent/backups/rankings.sqlite
```

The command uses SQLite VACUUM INTO and refuses to overwrite a backup. With WAL enabled, copying only the main database file while the server is running is not a valid backup procedure. To restore, stop the server, retain a copy of the current database/WAL files, and point RANKING_DB_PATH at the restored backup on persistent storage. Keep backups outside the server's own disk as part of hosting operations. The repository provides the backup command; no recurring external backup job has been provisioned.

## Client synchronization and limits

Local storage is now a retry queue and cached board, not the authoritative public database. Successful acknowledgements remove only the corresponding pending IDs. Lost responses can be retried without duplicate rows. A submission arriving during an existing refresh is flushed before reporting synchronization complete. Existing local-only results migrate once; a later server cache is never re-uploaded as new scores. The board shows connecting/server/offline state and offers REFRESH. Leaving a scene invalidates late UI callbacks. Reconnection retries pending results without a combat polling timer.

The server recalculates score from submitted kills and gold and validates basic ranges. Combat still runs on the client: this is not an authoritative anti-cheat service. No passwords or private account tokens are embedded in frontend assets.

Verification: npm test, npx tsc --noEmit, npm run assets:check, npm run build. npm run ranking:check launches an isolated production HTTP server, posts a result, restarts its process, confirms persistence, and checks static HTML/media ranges. It uses and removes its own temporary database.
