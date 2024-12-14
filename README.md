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
curl -X POST https://braggoscope-search-worker.genmon.workers.dev/build
```

Search:

```bash
curl --json '{"query": "the biggest planet"}' https://braggoscope-search-worker.genmon.workers.dev/search
```
