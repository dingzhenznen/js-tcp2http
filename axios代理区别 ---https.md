如果请求的地址是 https 
 axios 内部会 if (targetIsHttps) 来处理是否添加 https 代理
 如果是 非 https  对于 http://httpbin.org/ip
仍然是 修改 请求 path 和 host



options [Object: null prototype] {
  path: 'http://httpbin.org/ip',
  method: 'GET',
  headers: [Object: null prototype] {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'axios/1.18.1',
    'Accept-Encoding': 'gzip, compress, deflate, br',
    host: 'httpbin.org'
  },
  agents: { http: undefined, https: undefined },
  auth: undefined,
  protocol: 'http:',
  family: undefined,
  beforeRedirect: [Function: dispatchBeforeRedirect],
  beforeRedirects: [Object: null prototype] { proxy: [Function: beforeRedirect] },
  http2Options: undefined,
  hostname: '127.0.0.1',
  port: '7897',
  host: '127.0.0.1',
  agent: undefined,
  sensitiveHeaders: [],
  maxBodyLength: Infinity,
  insecureHTTPParser: false
}


如果是 https://httpbin.org

options [Object: null prototype] {
  path: '/ip',
  method: 'GET',
  headers: [Object: null prototype] {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'axios/1.18.1',
    'Accept-Encoding': 'gzip, compress, deflate, br'
  },
  agents: {
    http: undefined,
    https: HttpsProxyAgent {
      _events: [Object: null prototype] {},
      _eventsCount: 0,
      _maxListeners: undefined,
      timeout: null,
      maxFreeSockets: 1,
      maxSockets: 1,
      maxTotalSockets: Infinity,
      sockets: {},
      freeSockets: {},
      requests: {},
      options: {},
      secureProxy: false,
      proxy: [Object],
      [Symbol(shapeMode)]: false,
      [Symbol(kCapture)]: false,
      [Symbol(axios.http.installedTunnel)]: true
    }
  },
  auth: undefined,
  protocol: 'https:',
  family: undefined,
  beforeRedirect: [Function: dispatchBeforeRedirect],
  beforeRedirects: [Object: null prototype] { proxy: [Function: beforeRedirect] },
  http2Options: undefined,
  hostname: 'httpbin.org',
  port: '',
  agent: HttpsProxyAgent {
    _events: [Object: null prototype] {},
    _eventsCount: 0,
    _maxListeners: undefined,
    timeout: null,
    maxFreeSockets: 1,
    maxSockets: 1,
    maxTotalSockets: Infinity,
    sockets: {},
    freeSockets: {},
    requests: {},
    options: {},
    secureProxy: false,
    proxy: {
      protocol: 'http:',
      hostname: '127.0.0.1',
      port: 7897,
      auth: undefined,
      host: '127.0.0.1'
    },
    [Symbol(shapeMode)]: false,
    [Symbol(kCapture)]: false,
    [Symbol(axios.http.installedTunnel)]: true
  },
  sensitiveHeaders: [],
  maxBodyLength: Infinity,
  insecureHTTPParser: false
}