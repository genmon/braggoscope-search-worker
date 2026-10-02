# braggoscope-search-worker

Braggoscope search backend on a Cloudflare worker

Stripped down version of the [Braggoscope search backend](https://github.com/genmon/braggoscope-search), used in production on [braggoscope.com](https://braggoscope.com).

## Setup

```bash
npx wrangler vectorize create braggoscope-index --preset @cf/baai/bge-base-en-v1.5
npx wrangler vectorize create-metadata-index braggoscope-index \
  --property-name=title --type=string
npx wrangler vectorize create-metadata-index braggoscope-index \
  --property-name=published --type=string
npx wrangler vectorize create-metadata-index braggoscope-index \
  --property-name=permalink --type=string
```

In the Cloudflare Dashboard, set the following environment variables:

- `BUILD_INDEX_KEY`: The key to use for building the index

If building the index isn't working, check this is present. (The `keep_vars` setting in `wrangler.jsonc` should keep this available through deploys.)

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
