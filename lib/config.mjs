/**
 *  @template V 
 *  @typedef { import('./types').ValOrErr<V> } ValOrErr */
/** @typedef { import('./types').Config } Config */
/** @typedef { import('./types').Server } Server  */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import toml from 'toml'

import { log } from './log.mjs'
import { eVal, asVal, asErr, isErr } from './val-or-error.mjs'

const DEFAULT_PORT = 9200

/** @type { (configFile: string) => Config } */
export function getConfig(configFile) {
  const config = readConfig(configFile)
  if (config == null) {
    // should have been caught earlier, this is a just-in-case
    throw new Error('config file invalid')
  }

  /** @type { Config } */
  const finalConfig = {
    debug:      config?.debug || false,
    port:       config?.port  || DEFAULT_PORT,
    server:     config.server,
    ccs_server: config.ccs_server,
    fileName:   configFile,
  }

  return finalConfig
}

/** @type { (fileName: string) => string } */
export function expandInitialTilde(fileName) {
  return fileName.replace(/^~/, os.homedir())
}

/** @type { (fileName: string) => Config | void } */
export function readConfig(fileName) {
  if (!fs.existsSync(fileName)) {
    log(`config file "${fileName}" not found; ignoring`)
    return
  }

  if (fileName !== getBaseConfigFile()) {
    const stats = fs.statSync(fileName)
    const mode = (stats.mode & parseInt('777', 8)).toString(8)
    if (mode !== '600') {
      return log.exit(`config file "${fileName}" must be mode 600, is currently in mode ${mode}`)
    }
  }

  const contents = fileContents(fileName)
  if (isErr(contents)) {
    return log.exit(`error reading config file "${fileName}": ${contents.err.message}`, 1)
  }

  const parsed = parseToml(contents.val)
  if (isErr(parsed)) {
    return log.exit(`error parsing TOML in "${fileName}": ${parsed.err.message}`, 1)
  }

  const validated = validateConfig(fileName, parsed.val)
  if (isErr(validated)) {
    return log.exit(`config not valid in "${fileName}": ${validated.err.message}`, 1)
  }

  return validated.val
}

/** @type { (fileName: string, config: any) => ValOrErr<Config> } */
export function validateConfig(fileName, config) {
  if (typeof config.port  !== 'number'  && config.port  !== undefined) return asErr('config key "port" must be a number')
  if (typeof config.debug !== 'boolean' && config.debug !== undefined) return asErr('config key "debug" must be a boolean')

  if (typeof config?.server?.url !== 'string') {
    return asErr('config key "server.url" must be a string')    
  }

  if (config?.server?.api_key && typeof config?.server?.api_key !== 'string') {
    return asErr('config key "server.api_key" must be a string')    
  }

  if (typeof config?.ccs_server?.url !== 'string') {
    return asErr('config key "ccs_server.url" must be a string')    
  }

  if (typeof config?.ccs_server?.api_key !== 'string') {
    return asErr('config key "ccs_server.api_key" must be a string')    
  }

  const server     = { url: config.server.url,     api_key: config?.server?.api_key }
  const ccs_server = { url: config.ccs_server.url, api_key: config.ccs_server.api_key }

  const result = {
    port: config.port,
    debug: config.debug,
    fileName,
    server,
    ccs_server
  }

  return asVal(result)
}

/** @type { (source: string) => ValOrErr<object> } */
function parseToml(source) {
  return eVal(() => toml.parse(source))
}

/** @type { (fileName: string) => ValOrErr<string> } */
function fileContents(fileName) {
  return eVal(() => fs.readFileSync(fileName, 'utf-8'))
}

/** @type { () => string } */
function getBaseConfigFile() {
  const thisFile = new URL(import.meta.url).pathname
  const thisDir = path.dirname(thisFile)
  return `${thisDir}/base-config.toml`
}

/** @type { (url: string) => boolean } */
function isValidURL(url) {
  try {
    new URL(url)
    return true
  } catch (err) {
    return false
  }
}