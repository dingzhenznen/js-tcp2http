import { TcpHttpServer } from './tcp-http-server.js';

const server = new TcpHttpServer((req, res) => {
  console.log(`[request] ${req.method} ${req.url}`);
  const chunks = [];

  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body ? JSON.parse(body) : null
      })
    );
  });
});

server.listen(3001, '127.0.0.1', () => {
  console.log('tcp http server listening on http://127.0.0.1:3001');
});
