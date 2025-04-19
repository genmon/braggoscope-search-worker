export interface Env {
	VECTORIZE: Vectorize;
	AI: Ai;
	BUILD_INDEX_KEY: string;
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

async function indexSome(env: Env, episodes: Episode[]): Promise<void> {
	const { data: embeddings } = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
		text: episodes.map((episode) => episode.description),
	});

	const vectors = episodes.map((episode, i) => ({
		id: episode.id,
		values: embeddings[i],
		metadata: {
			title: episode.title,
			published: episode.published,
			permalink: episode.permalink,
			description: episode.description,
		},
	}));

	// Upsert the embeddings into the database
	await env.VECTORIZE.upsert(vectors);
}

async function indexAll(env: Env): Promise<void> {
	const episodes = await getEpisodes();

	const PAGE_SIZE = 5;
	for (let i = 0; i < episodes.length; i += PAGE_SIZE) {
		try {
			await retry(async () => {
				await indexSome(env, episodes.slice(i, i + PAGE_SIZE));
			});
		} catch (err) {
			console.error(err);
			throw err;
		}
	}
}

async function search(env: Env, query: string, includeDescription: boolean) {
	// Get the embedding for the query
	const { data: embeddings } = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
		text: [query],
	});

	// Search the index for the query vector
	const nearest: any = await env.VECTORIZE.query(embeddings[0], {
		topK: 15,
		returnValues: false,
		returnMetadata: includeDescription ? 'all' : 'indexed',
	});

	// Convert to a form useful to the client
	const found: Found[] = nearest.matches.map((match: any) => ({
		id: match.id,
		...match.metadata,
		score: match.score,
	}));

	return found;
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
				const body = await request.json();
				const { query } = body as any;
				const includeDescription = (body as any).includeDescription === true;
				const found = await search(env, query, includeDescription);
				return Response.json({ episodes: found }, { headers: CORS });
			} else if (path.startsWith('/build')) {
				const { key } = (await request.json()) as any;
				if (key !== env.BUILD_INDEX_KEY) {
					return new Response('Unauthorized', { status: 401 });
					//return new Response(`Unauthorized. Use key: ${env.BUILD_INDEX_KEY}`, { status: 401 });
				}
				await indexAll(env);
				return new Response('OK', { headers: CORS });
			} else {
				return new Response('Not Found', { status: 404 });
			}
		} else if (method === 'OPTIONS') {
			return new Response('OK', { headers: CORS });
		}

		return new Response('Method Not Allowed', { status: 405 });
	},

	async scheduled(event, env, ctx) {
		await indexAll(env);
	},
} satisfies ExportedHandler<Env>;

// API calls be a bit flaky. Here's a helper to retry them a few times
async function retry<T>(fn: () => Promise<T>, retries: number = 5): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		if (retries > 0) {
			console.log('Retrying...');
			return await retry(fn, retries - 1);
		}
		throw err;
	}
}
