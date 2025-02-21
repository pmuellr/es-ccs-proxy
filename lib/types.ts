// only types, used for validation in vscode

export type { Val, Err, ValOrErr } from './val-or-error'

export interface Server {
  url:        string
  api_key?:   string
}

export interface Cli {
  port?:      number
  configFile: string
  help:       boolean
  version:    boolean
  debug:      boolean
  output:     string
}

export interface Config {
  debug?:     boolean
  port?:      number
  server:     Server
  ccs_server: Server
  fileName:   string
}

export interface RequestTranslator {
  // returns whether this is a CCS request
  isCCS(): boolean

  // returns whether this is an async search request (initial)
  isAsyncSearchInitial(): boolean

  // given the path of the request, returns the CCS path
  fixPath(path: string[]): string[]
}