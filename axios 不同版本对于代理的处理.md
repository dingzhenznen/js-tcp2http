"axios": "^1.13.2",  修改 path

options {
  path: 'http://httpbin.org/ip',
  method: 'GET',
  headers: [Object: null prototype] {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'axios/1.13.2',
    'Accept-Encoding': 'gzip, compress, deflate, br',
    host: 'httpbin.org'
  },
  agents: { http: undefined, https: undefined },
  auth: undefined,
  protocol: 'http:',
  family: undefined,
  beforeRedirect: [Function: dispatchBeforeRedirect],
  beforeRedirects: { proxy: [Function: beforeRedirect] },
  http2Options: undefined,
  hostname: '127.0.0.1',
  port: '7897',
  host: '127.0.0.1',
  agent: undefined
}


  "axios": "^1.18.1"  修改代理 agent

没有代理 
options [Object: null prototype] {
  path: '/ip',
  method: 'GET',
  headers: [Object: null prototype] {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'axios/1.18.1',
    'Accept-Encoding': 'gzip, compress, deflate, br'
  },
  agents: { http: undefined, https: undefined },
  auth: undefined,
  protocol: 'https:',
  family: undefined,
  beforeRedirect: [Function: dispatchBeforeRedirect],
  beforeRedirects: [Object: null prototype] { proxy: [Function: beforeRedirect] },
  http2Options: undefined,
  hostname: 'httpbin.org',
  port: '',
  agent: undefined,
  sensitiveHeaders: [],
  maxBodyLength: Infinity,
  insecureHTTPParser: false
}

使用代理 

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




  