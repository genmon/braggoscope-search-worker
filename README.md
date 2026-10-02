# braggoscope-search-worker

Braggoscope search backend on a Cloudflare worker

Stripped down version of the [Braggoscope search backend](https://github.com/genmon/braggoscope-search), used in production on [braggoscope.com](https://braggoscope.com).

## Rebuilding the backend

Everything this worker depends on outside the repo, so it can be recreated from scratch. All of it lives in the **matt@interconnected.org** Cloudflare account (`account_id` in `wrangler.jsonc`; the same login can also see the Inanimate account, which this worker doesn't use).

### 1. Vectorize index

```bash
npx wrangler vectorize create braggoscope-index --preset @cf/baai/bge-base-en-v1.5
npx wrangler vectorize create-metadata-index braggoscope-index \
  --property-name=title --type=string
npx wrangler vectorize create-metadata-index braggoscope-index \
  --property-name=published --type=string
npx wrangler vectorize create-metadata-index braggoscope-index \
  --property-name=permalink --type=string
```

Then fill it: `POST /build` (see Usage) or wait for the Thursday cron.

### 2. AI Gateway

Create a gateway named **`braggoscope-aig`** (dashboard: AI → AI Gateway). The worker passes it as `{ gateway: { id: 'braggoscope-aig' } }` to `env.AI.run`, so the binding authenticates and no API token is needed.

Audio transcription can't use it yet (tested 2026-10-02): the binding route rejects streamed bodies ("AI Gateway does not support ReadableStreams yet"), and the REST route through the gateway rejects binary audio (`7000 Invalid request body`). Calls to `@cf/deepgram/nova-3` go straight to Workers AI and appear in Workers AI usage, not the gateway logs.

### 3. Worker secrets

Set these in the dashboard (Workers & Pages → braggoscope-search-worker → Settings → Variables and Secrets) or with `npx wrangler secret put NAME`. Deploys never remove secrets. `wrangler.jsonc` lists them under `secrets.required`, so `wrangler deploy` refuses to deploy if one is missing.

| Secret | What it is |
|---|---|
| `BUILD_INDEX_KEY` | Any random string; callers of `POST /build` must send it |
| `TRANSCRIBE_KEY` | Random string; the braggoscope pipeline sends it as `Authorization: Bearer …` to `POST /transcribe`. Keep a copy in braggoscope's `.env` as `TRANSCRIBE_KEY` |

`wrangler dev` can't see dashboard secrets. For local development, copy `.dev.vars.example` to `.dev.vars` and fill in stand-in values.

### 4. Automatic deploys

Connect the worker to the GitHub repo `genmon/braggoscope-search-worker` with Workers Builds (Workers & Pages → braggoscope-search-worker → Settings → Build), deploying `main`. See Deploy.

## Development

```bash
nvm use            # Node 24 from .nvmrc. Use npm 11 to add/upgrade deps: npm 10 crashes resolving vitest's peers without a lockfile
npm install
npm run typecheck
npm test           # routing/auth only; AI + Vectorize are remote-only
npm run dev        # wrangler dev, against the live index
```

After changing `wrangler.jsonc`, regenerate `worker-configuration.d.ts` with `npm run cf-typegen`.

## Deploy

Pushing to `main` deploys automatically (Cloudflare Workers Builds, connected to this GitHub repo). Build Node version comes from `.nvmrc`.

To deploy by hand, e.g. from a branch:

```bash
npx wrangler deploy
```

## Test

```bash
curl --json '{"query": "hello"}' https://braggoscope-search-worker.genmon.workers.dev/search
```

## Usage

Build each time a new episode is added:

```bash
curl --json '{"key": "BUILD_INDEX_KEY"}' https://braggoscope-search-worker.genmon.workers.dev/build
```

(Replace `BUILD_INDEX_KEY` with the actual key. This is to prevent re-building the index by accident.)

Search:

```bash
curl --json '{"query": "the biggest planet"}' https://braggoscope-search-worker.genmon.workers.dev/search
```

Transcribe an MP3 with Deepgram Nova-3 (used by braggoscope's `bragg transcribe raw`; query parameters are Nova-3 options):

```bash
curl -X POST -H "Authorization: Bearer $TRANSCRIBE_KEY" -H "Content-Type: audio/mpeg" \
  --data-binary @episode.mp3 \
  "https://braggoscope-search-worker.genmon.workers.dev/transcribe?diarize=true&utterances=true&smart_format=true&language=en"
```
