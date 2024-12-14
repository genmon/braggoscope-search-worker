# braggoscope-search-worker

Braggoscope search backend on a Cloudflare worker

## Setup

```bash
npx wrangler vectorize create braggoscope-index --preset @cf/baai/bge-base-en-v1.5
```

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
