# braggoscope-search-worker

Braggoscope search backend on a Cloudflare worker

Stripped down version of the [Braggoscope search backend](https://github.com/genmon/braggoscope-search), used in production on [braggoscope.com](https://braggoscope.com).

## Setup

```bash
npx wrangler vectorize create braggoscope-index --preset @cf/baai/bge-base-en-v1.5
```

In the Cloudflare Dashboard, set the following environment variables:

- `BUILD_INDEX_KEY`: The key to use for building the index

If building the index isn't working, check this is present. (The `keep_vars` setting in `wrangler.toml` should keep this available through deploys.)

## Deploy

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
