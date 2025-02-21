/** @typedef { import('./types').Server } Server */
/** @typedef { import('./types').Config } Config */

import http from 'node:http'
import httpProxy from 'http-proxy'
import { ServerResponse, IncomingMessage } from 'node:http'

import { log } from './log.mjs'
import { createDeferred } from './deferred.mjs'
import { getRequestTranslator } from './request_translator.mjs'
import { addCCSAsyncSearchId } from './async_searches.mjs'

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

  // @ts-ignore
  proxy.on('proxyRes', onProxyRes)
  proxy.on('proxyReq', onProxyReq)
  proxy.on('error', onError)

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
    const requestTranslator = getRequestTranslator(req.url || '')
    const isCCS = requestTranslator.isCCS()
    const server = isCCS ? config.ccs_server : config.server;

    const type = isCCS ? 'ccs:    ' : 'non-ccs:'

    let skipLog = false
    for (const path of SkipLogPaths) {
      if (req.url?.includes(path)) skipLog = true
    }

    const method = (req.method || '?').padEnd(6)
    if (!skipLog) {
      if (isCCS) {
        log(`proxying request to ${type} ${method} ${req.url}`)
      } else {
        log.debug(`proxying request to ${type} ${method} ${req.url}`)
      }
    } else {
      log.debug(`proxying request to ${type} ${method} ${req.url}`)
    } 
    proxy.web(req, res, { target: server.url })
  }

  /** @type (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>, options: httpProxy.ServerOptions) => void } */
  function onProxyReq(proxyReq, req, res, options) {
    const requestTranslator = getRequestTranslator(req.url || '')
    const isCCS = requestTranslator.isCCS()
    const server = isCCS ? config.ccs_server : config.server;

    if (isCCS) {
      const parts = proxyReq.path.split('/')
      proxyReq.path = requestTranslator.fixPath(parts).join('/')
      // log(`proxying ccs request to: ${proxyReq.path}`)
    }

    if (server.api_key) {
      proxyReq.setHeader('Authorization', `ApiKey ${server.api_key}`)
    }
  }

  /** @type (proxyRes: http.IncomingMessage, req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>, options: httpProxy.ServerOptions) => Promise<void> } */
  async function onProxyRes(proxyRes, req, res) {
    const requestTranslator = getRequestTranslator(req.url || '')
    const isCCS = requestTranslator.isCCS()

    if (!isCCS) return

    const method = (req.method || '?').padEnd(6)
    const message = `proxying response from ccs:  ${method} ${req.url} -- ${res.statusCode}`
    log(message)

    if (requestTranslator.isAsyncSearchInitial()) {
      try {
        const id = await getAsyncSearchId(proxyRes, req, res)
        log(`CCS async search id: ${id}`)
        if (id) {
          addCCSAsyncSearchId(id)        
        }
      } catch (err) {
        log(`error getting async search id: ${err}`)
      }
    }
  }

  /** @type (proxyRes: http.IncomingMessage, req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => Promise<string | undefined> } */
  async function getAsyncSearchId(proxyRes, req, res) {
    const body = await captureBody(proxyRes, req, res)
    // console.log("body from proxied server:", body)
    const json = JSON.parse(body)
    const id = json.id
    return id
  }

  /** @type (proxyRes: http.IncomingMessage, req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => Promise<string> } */
  function captureBody(proxyRes, req, res) {
    const bodyDeferred = createDeferred()
    /** @type { any[] } */
    const body = []
    proxyRes.on('data', function (chunk) {
        body.push(chunk)
//        res.write(chunk)
    })
    proxyRes.on('error', function (err) {
      bodyDeferred.reject(err)
    })
      // @ts-ignore
    proxyRes.on('end', function (chunk) {
      if (chunk) {
        body.push(chunk)
//        res.end(chunk)
      } else {
//        res.end()
      }

      const content = Buffer.concat(body).toString()
      bodyDeferred.resolve(content)
      // console.log("content from proxied server:", content)
    })

    return bodyDeferred.promise
  }  

  /** @type { (err: Error, req: IncomingMessage, res_socket: http.ServerResponse<http.IncomingMessage>) => void }  */
  function onError(err, req, res_socket) {
    /** @type { ServerResponse } */
    let res

    // @ts-ignore
    res  = res_socket

    res.writeHead(500, {
      'Content-Type': 'text/plain'
    })
   
    res.end(`error proxying request: ${err.message}`)
    log(`error proxying request: ${err.message}`)
  }
}
