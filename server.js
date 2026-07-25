import http from 'node:http';

const server = http.createServer((req, res) => {
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

server.listen(3000, () => {
  console.log('demo server listening on http://localhost:3000');
});
