/** @typedef { import('./types').RequestTranslator } RequestTranslator */

import { isCCSAsyncSearchId } from './async_searches.mjs'

/** @type { (path: string) => RequestTranslator } */
export function getRequestTranslator(path) {
  /** @type { RequestTranslator } */
  let requestTranslator

  const url = new URL(path, 'http://localhost')
  path = url.pathname
  
  // '/a/b/c'.split('/) => ['', 'a', 'b', 'c']
  const pathParts = path.split('/')

  const testClasses = [
    RemoteWithColon1,
    RemoteWithColon3,
    IndexWithColon1,
    IndexWithColon3,
    AsyncSearch,
  ]

  for (const TestClass of testClasses) {
    if (TestClass.testCCSRequest(pathParts)) {
      return new TestClass(pathParts)
    }
  }

  return new LocalRequestTranslator(pathParts)
}

const Colon = ':'
const ColonString = '-colon-'
const ColonRegexp = /-colon-/g
const ColonEscaped = encodeURIComponent(Colon)
const RemotePrefix = 'remote--'

/** @type { (part?: string) => boolean } */
function partIsRemote(part) {
  if (!part) return false
  return part.startsWith(RemotePrefix) && part.includes(ColonString)
}

/** @type { (part?: string) => string } */
function fixRemotePart(part) {
  if (!part) return ''
  return part.slice(RemotePrefix.length).replace(ColonRegexp, ColonEscaped)
}

/** @type { (part?: string) => boolean } */
function partIsColon(part) {
  if (!part) return false
  return part.includes(Colon) || part.includes(ColonEscaped)
}

/** @type { (path: string[]) => boolean } */
function isResolveIndex(path) {
  // console.log(`isResolveIndex: "${path[1]}/${path[2]}"`)
  return `${path[1]}/${path[2]}` == '_resolve/index'
}

// /{CCS-pattern}/_async_search
/** @type { (path: string[]) => boolean } */
function isAsyncSearchInitial(path) {
  const pattern = path[1]
  const asyncSearch = path[2]
  
  if (!partIsColon(pattern) && !partIsRemote(pattern)) return false
  if (asyncSearch != '_async_search') return false

  return true
}

// /_async_search/{id}/...
// /_async_search/status/{id}/...
/** @type { (path: string[]) => boolean } */
function isAsyncSearchFollowOn(path) {
  const asyncSearch = path[1]
  if (asyncSearch != '_async_search') return false

  const id = (path[2] === 'status') ? path[3] : path[2]

  return isCCSAsyncSearchId(id)
}

//----------------------------------------------------------------------
/** @implements RequestTranslator */
class BasicRequestTranslator {
  /** @param {string[]} path */
  constructor(path) { 
    this.path = path
  }

  /** @type { () => boolean } */
  isCCS() { return false }

  /** @type { () => boolean } */
  isAsyncSearchInitial() { return false }

  /** @type { () => string[] } */
  fixPath() { return this.path }
}

//----------------------------------------------------------------------
class LocalRequestTranslator extends BasicRequestTranslator {
  /** @param {string[]} path */
  constructor(path) { 
    super(path)
  }

  /** @type { (path: string[]) => boolean } */
  static testCCSRequest(path) { return false }
}

//----------------------------------------------------------------------
class CCSRequestTranslator extends BasicRequestTranslator {
  /** @param {string[]} path */
  constructor(path) { 
    super(path)
  }

  /** @type { () => boolean } */
  isCCS() { return true }
}

//----------------------------------------------------------------------
// /{remote--}/...
/** @implements RequestTranslator */
class RemoteWithColon1 extends CCSRequestTranslator {
  /** @type { (path: string[]) => boolean } */
  static testCCSRequest(path) { 
    return partIsRemote(path[1])
   }

  /** @type { () => string[] } */
  fixPath() { 
    const path = this.path.slice()
    path[1] = fixRemotePart(path[1])
    return path
   }

  /** @type { () => boolean } */
  isAsyncSearchInitial() { 
    return isAsyncSearchInitial(this.path)
  }
}

//----------------------------------------------------------------------
// /_resolve/index/{remote--}/...
/** @implements RequestTranslator */
class RemoteWithColon3 extends CCSRequestTranslator {
  /** @type { (path: string[]) => boolean } */
  static testCCSRequest(path) { 
    // console.log(`RemoteWithColon3: path: "${JSON.stringify(path)}"`)
    if (!isResolveIndex(path)) return false
    // console.log(`RemoteWithColon3: isResolvedIndex!`)
    return partIsRemote(path[3])
   }

  /** @type { () => string[] } */
  fixPath() { 
    const path = this.path.slice()
    path[3] = fixRemotePart(path[3])
    return path
   }
}

//----------------------------------------------------------------------
// /...:.../...
/** @implements RequestTranslator */
class IndexWithColon1 extends CCSRequestTranslator {
  /** @type { (path: string[]) => boolean } */
  static testCCSRequest(path) {
    return partIsColon(path[1])
   }

  /** @type { () => boolean } */
  isAsyncSearchInitial() { 
    return isAsyncSearchInitial(this.path)
  }
}

//----------------------------------------------------------------------
// /_resolve/index/...:.../...
/** @implements RequestTranslator */
class IndexWithColon3 extends CCSRequestTranslator {
  /** @type { (path: string[]) => boolean } */
  static testCCSRequest(path) {
    if (!isResolveIndex(path)) return false
    return partIsColon(path[3])
   }
}

//----------------------------------------------------------------------
// /_async_search/{id}/...
// /_async_search/status/{id}/...
/** @implements RequestTranslator */
class AsyncSearch extends CCSRequestTranslator {
  /** @type { (path: string[]) => boolean } */
  static testCCSRequest(path) {
    return isAsyncSearchFollowOn(path)
   }
}

