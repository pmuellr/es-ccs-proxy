/** @typedef { import('./types').RequestTranslator } RequestTranslator */

/** @type { Set<string> } */
const AsyncSearches = new Set()

/** @type { (id: string) => void } */
export function addCCSAsyncSearchId(id) {
  AsyncSearches.add(id)
  AsyncSearches.add(encodeURIComponent(id))
}

/** @type { (id: string) => boolean } */
export function isCCSAsyncSearchId(id) {
  return AsyncSearches.has(id)
}

// Where's the delete function?  We would need to add some code to 
// trap the async search deletion, which would call the delete function.
// But, it should probably be in a LRU cache, so that in case someone
// retries something, or is using some stale data, at least we'd proxy
// it to the right place.