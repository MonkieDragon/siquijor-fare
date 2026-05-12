/**
 * Shared Nominatim access: serial throttle (~1 req/s), identifying User-Agent,
 * optional AbortSignal, short GET dedupe cache.
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */

const MIN_INTERVAL_MS = 1100;

const CACHE_TTL_MS = 60_000;

const USER_AGENT =
  "siquijor-fare/0.0.0 (tourist tricycle fare estimator; contact via repository maintainer)";

const defaultHeaders: HeadersInit = {
  Accept: "application/json",

  "User-Agent": USER_AGENT,
};

const cache = new Map<string, { expiry: number; body: unknown }>();

let throttleTail = Promise.resolve();

function readCache(url: string): unknown | undefined {
  const row = cache.get(url);

  if (!row || row.expiry <= Date.now()) {
    if (row) {
      cache.delete(url);
    }

    return undefined;
  }

  return row.body;
}

function writeCache(url: string, body: unknown): void {
  cache.set(url, { expiry: Date.now() + CACHE_TTL_MS, body });
}

function runThrottled<T>(task: () => Promise<T>): Promise<T> {
  const job = throttleTail.then(async () => {
    try {
      return await task();
    } finally {
      await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS));
    }
  });

  throttleTail = job.then(() => {}).catch(() => {});

  return job;
}

/**
 * GET JSON from Nominatim with politeness queue and cache.
 */
export async function nominatimGetJson(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const cached = readCache(url);

  if (cached !== undefined) {
    return cached;
  }

  return runThrottled(async () => {
    const again = readCache(url);

    if (again !== undefined) {
      return again;
    }

    const res = await fetch(url, {
      signal,

      headers: defaultHeaders,
    });

    if (!res.ok) {
      throw new Error(`Nominatim HTTP ${res.status}`);
    }

    const body: unknown = await res.json();

    writeCache(url, body);

    return body;
  });
}
