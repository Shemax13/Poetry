# Restore Instructions — Shemaxpoetry

Backup created: 2026-07-03 11:02 (UTC)

## Contents

| File | Description |
|------|-------------|
| `source.tar.gz` | Full git archive (source code, configs) |
| `bundled_deploy.mjs` | Worker entry point |
| `wrangler.jsonc` | Wrangler config |
| `deploy.mjs` | Deploy scripts |
| `d1-table-songs.json` | 453 songs |
| `d1-table-admin_sessions.json` | Admin sessions |
| `d1-table-messages.json` | Messages |
| `d1-table-extra_audio.json` | Extra audio |
| `d1-table-song_external_links.json` | External links |
| `d1-table-settings.json` | Settings |
| `d1-table-external_link_types.json` | Link types |
| `d1-table-d1_migrations.json` | Migration history |
| `d1-tables.json` | Table list |
| `kv-keys.json` | KV keys list |
| `kv-data/` | KV values (text) |
| `worker-versions.txt` | Worker version history |
| `worker-deployments.txt` | Deployment history |
| `worker-secrets.txt` | Secret names (values NOT stored) |

## Restore Steps

### 1. Restore D1 database

```bash
# Import songs
cat d1-table-songs.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
# Generate INSERT statements
"

# Or use wrangler for each table
for table in songs admin_sessions messages extra_audio settings; do
  # Re-create via wrangler d1 execute
  cat d1-table-$table.json | python3 ...
done
```

### 2. Restore KV namespace

```bash
# Re-create namespace
npx wrangler kv namespace create POETRY_STATIC

# Upload each file
for file in kv-data/*; do
  key=$(basename "$file" | tr '_' '/')
  npx wrangler kv key put --namespace-id <NEW_ID> "$key" --path "$file" --remote
done
```

### 3. Restore Worker

```bash
# Unpack source
tar xzf source.tar.gz

# Configure wrangler.jsonc with new IDs
# Set secrets
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put TURNSTILE_SECRET_KEY

# Deploy
npx wrangler deploy
```

### 4. Required Secrets

The following secrets are NOT in the backup (values known only to you):

- `TELEGRAM_BOT_TOKEN` — `8719069421:AAF5fHPUL3vmH_5yl26UGnbH1uxMPKHhWsI`
- `ADMIN_PASSWORD` — your admin password
- `TURNSTILE_SECRET_KEY` — your Turnstile secret

**Bindings at backup time:**
- `DB` → D1 `c139e4fb-afee-4752-978e-f323bbec4aa7`
- `STATIC` → KV `1994525bead042229fed7f2bd41d2f3a`
- `UPLOAD_QUEUE` → Queue `shemax-uploads`

## Notes

- Songs total: 453
- KV keys total: 27
- Worker version: `a0beef1f-8e15-41cb-879f-6d1dabf44e92` (latest deployed)
