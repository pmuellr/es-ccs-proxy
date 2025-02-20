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
  isCCS: boolean
  testCCSRequest(path: string[]): boolean
  fixPath(path: string[]): string[]
}