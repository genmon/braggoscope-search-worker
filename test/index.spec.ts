import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

// Integration tests for routing and auth only: /search and an authorised /build
// need the remote AI and Vectorize bindings, so they're smoke-tested by hand.
describe('braggoscope-search-worker', () => {
	it('404s GET requests', async () => {
		const response = await SELF.fetch('https://example.com/');
		expect(response.status).toBe(404);
	});

	it('answers CORS preflight', async () => {
		const response = await SELF.fetch('https://example.com/search', { method: 'OPTIONS' });
		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
	});

	it('rejects /build without the right key', async () => {
		const response = await SELF.fetch('https://example.com/build', {
			method: 'POST',
			body: JSON.stringify({ key: 'wrong' }),
		});
		expect(response.status).toBe(401);
	});

	it('404s unknown POST paths', async () => {
		const response = await SELF.fetch('https://example.com/nope', { method: 'POST', body: '{}' });
		expect(response.status).toBe(404);
	});

	it('405s other methods', async () => {
		const response = await SELF.fetch('https://example.com/search', { method: 'PUT' });
		expect(response.status).toBe(405);
	});
});
