#!/usr/bin/env node

/** @typedef { import('./lib/types').Server } Server */
/** @typedef { import('./lib/types').Config } Config */

// import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { log } from './lib/log.mjs'
import { pkg } from './lib/pkg.mjs'
import { getCli } from './lib/cli.mjs'
import { startProxy } from './lib/proxy.mjs'
import { getConfig, expandInitialTilde } from './lib/config.mjs'

main()

async function main() {
  // get cli arguments, read and generate config
  const cli = getCli(process.argv.slice(2))
  const { help, version, debug, configFile: rawConfigFile } = cli
  const configFile = expandInitialTilde(rawConfigFile)

  log.setDebug(!!debug)

  const config = getConfig(configFile)
 
  log.debug(`cli: ${JSON.stringify(cli)}`)
  log.debug(`config: ${JSON.stringify(config, redactSecrets)}`)

  // handle flags
  if (help) { console.log(await getHelp()); process.exit(1) }
  if (version) { console.log(pkg.version); process.exit(1) }

  // print servers
  log(`non-CCS server: ${config.server.url}`)
  log(`CCS server:     ${config.ccs_server.url}`)

  start(config)
}

/** @type { (config: Config) => Promise<void> } */
async function start(config) {
  try {
    await startProxy(config)
  } catch (err) {
    log.exit(`error starting server: ${err}`, 1)
  }
}

/** @type { () => Promise<string> } */
async function getHelp() {
  const thisFile = new URL(import.meta.url).pathname
  const thisDir = path.dirname(thisFile)
  return await readFile(`${thisDir}/README.md`, 'utf-8')
}

/** @type { (key: string, val: any) => any } */
function redactSecrets(key, val) {
  if (key === 'user') return '<** user **>'
  if (key === 'pass') return '<** pass **>'
  if (key === 'apiKey') return '<** apiKey **>'
  return val
}