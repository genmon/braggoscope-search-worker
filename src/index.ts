/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	VECTORIZE: Vectorize;
	AI: Ai;
}

interface EmbeddingResponse {
	shape: number[];
	data: number[][];
}

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST',
	'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
};

type Episode = {
	id: string;
	title: string;
	published: string;
	permalink: string;
	description: string;
};

type Found = Omit<Episode, 'description'> & { score: number };

async function getEpisodes(): Promise<Episode[]> {
	return await fetch('https://www.braggoscope.com/episodes.json').then((res) => res.json());
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const method = request.method;
		const path = new URL(request.url).pathname;

		if (method === 'GET') {
			if (path.startsWith('/favicon')) {
				return new Response('', { status: 404 });
			} else {
				return new Response('Not Found', { status: 404 });
			}
		} else if (method === 'POST') {
			if (path.startsWith('/search')) {
				return new Response('{}', { headers: CORS });
			} else {
				return new Response('Not Found', { status: 404 });
			}
		} else if (method === 'OPTIONS') {
			return new Response('OK', { headers: CORS });
		}

		return new Response('Method Not Allowed', { status: 405 });
	},
} satisfies ExportedHandler<Env>;
