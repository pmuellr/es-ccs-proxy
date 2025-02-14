/** @typedef { import('./types').Server } Server */
/** @typedef { import('./types').Config } Config */

import http from 'node:http'
import httpProxy from 'http-proxy'
import { createDeferred } from './deferred.mjs'
import { ServerResponse, IncomingMessage } from 'node:http'

import { log } from './log.mjs'

const SkipLogPaths = [
  '/.kibana_task_manager'
]

/** @type { (config: Config) => Promise<void> } */
export async function startProxy(config) {
  // see: https://www.npmjs.com/package/http-proxy

  /** @type { httpProxy.ServerOptions } */
  const proxyOptions = {
    xfwd: false,
    changeOrigin: true,
  }

  const proxy = httpProxy.createProxyServer(proxyOptions)

  proxy.on('error', function (err, req, res_socket) {
    /** @type { ServerResponse } */
    let res
    // @ts-ignore
    res  = res_socket

    res.writeHead(500, {
      'Content-Type': 'text/plain'
    })
   
    res.end(`error proxying request: ${err.message}`)
    log(`error proxying request: ${err.message}`)
  })

  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    const isCCS = isCCSRequest(req)
    const server = isCCS ? config.ccs_server : config.server;

    if (server.api_key) {
      proxyReq.setHeader('Authorization', `ApiKey ${server.api_key}`)
    }
  })

  proxy.on('proxyRes', function (proxyRes, req, res) {
    const message = `${res.statusCode} ${req.method} ${req.url}`

    if (res.statusCode >= 400) {
      log(message)
      log(`^^^ error: ${res.statusCode}`)
      return
    }

    if (isCCSRequest(req)) {
      log(message)
    }
  })

  const server = http.createServer(requestHandler)

  const listenDone = createDeferred()
  const port = config.port
  try {
    server.listen({ port, host: '127.0.0.1' }, () => {
      log(`server started on port ${port}, access at http://127.0.0.1:${port}/`)
      listenDone.resolve(undefined)
    })
  } catch (err) {
    listenDone.reject(err)
  }

  return listenDone.promise

  /** @type { (req: IncomingMessage, res: ServerResponse) => void } */
  function requestHandler(req, res) {
    const isCCS = isCCSRequest(req)
    const server = isCCS ? config.ccs_server : config.server;

    const type = isCCS ? 'ccs    ' : 'non-ccs'

    let skip = false
    for (const path of SkipLogPaths) {
      if (req.url?.includes(path)) {
        skip = true
        break
      }
    }

    if (!skip) {
      log.debug(`proxying request to ${type}: ${req.url}`)
    } 
    proxy.web(req, res, { target: server.url })
  }
}

/** @type { (req: IncomingMessage) => boolean } */
function isCCSRequest(req) {
  const url = new URL(req.url || '', 'http://localhost')
  const parts = url.pathname.split('/').filter(Boolean)
  const [pattern] = parts
  if (!pattern) return false
 
  if (pattern.includes(':')) return true
  if (pattern.includes('%3A')) return true

  return false
}
