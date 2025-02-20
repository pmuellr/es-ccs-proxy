/** @typedef { import('./types').RequestTranslator } RequestTranslator */

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
  ]

  for (const TestClass of testClasses) {
    requestTranslator = new TestClass()
    if (requestTranslator.testCCSRequest(pathParts)) {
      return requestTranslator
    }
  }

  return new LocalRequestTranslator()
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

/** @implements RequestTranslator */
class LocalRequestTranslator {
  constructor() { this.isCCS = false }

  /** @type { (path: string[]) => boolean } */
  testCCSRequest(path) { return false }

  /** @type { (path: string[]) => string[] } */
  fixPath(path) { return path }
}

/** @implements RequestTranslator */
class RemoteWithColon1 {
  constructor() { this.isCCS = true }

  /** @type { (path: string[]) => boolean } */
  testCCSRequest(path) { 
    return partIsRemote(path[1])
   }

  /** @type { (path: string[]) => string[] } */
  fixPath(path) { 
    path[1] = fixRemotePart(path[1])
    return path
   }
}

/** @implements RequestTranslator */
class RemoteWithColon3 {
  constructor() { this.isCCS = true }

  /** @type { (path: string[]) => boolean } */
  testCCSRequest(path) { 
    // console.log(`RemoteWithColon3: path: "${JSON.stringify(path)}"`)
    if (!isResolveIndex(path)) return false
    // console.log(`RemoteWithColon3: isResolvedIndex!`)
    return partIsRemote(path[3])
   }

  /** @type { (path: string[]) => string[] } */
  fixPath(path) { 
    path[3] = fixRemotePart(path[3])
    return path
   }
}

/** @implements RequestTranslator */
class IndexWithColon1 {
  constructor() { this.isCCS = true }

  /** @type { (path: string[]) => boolean } */
  testCCSRequest(path) {
    return partIsColon(path[1])
   }

  /** @type { (path: string[]) => string[] } */
  fixPath(path) { return path }
}

/** @implements RequestTranslator */
class IndexWithColon3 {
  constructor() { this.isCCS = true }

  /** @type { (path: string[]) => boolean } */
  testCCSRequest(path) {
    if (!isResolveIndex(path)) return false
    return partIsColon(path[3])
   }

  /** @type { (path: string[]) => string[] } */
  fixPath(path) { return path }
}

