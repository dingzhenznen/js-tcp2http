import { TcpHttpServer } from './tcp-http-server.js';

const server = new TcpHttpServer((req) => {
  console.log(`[request] ${req.method} ${req.url}`);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: {
      ok: true,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body ? JSON.parse(req.body) : null
    }
  };
});

server.listen(3001, '127.0.0.1', () => {
  console.log('tcp http server listening on http://127.0.0.1:3001');
});
