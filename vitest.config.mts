import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: './wrangler.jsonc' },
			miniflare: { bindings: { BUILD_INDEX_KEY: 'test-key', TRANSCRIBE_KEY: 'test-transcribe-key' } },
		}),
	],
});
