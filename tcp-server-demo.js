import TcpHttpClient from './tcp-http-client.js';

await runGetDemo();
await runPostDemo();

function runGetDemo() {
  return new Promise((resolve, reject) => {
    const req = TcpHttpClient.get('http://127.0.0.1:3001/books?id=1', (res) => {
      const chunks = [];

      console.log('GET status:', res.statusCode);

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        console.log('GET body:', Buffer.concat(chunks).toString('utf8'));
        resolve();
      });
    });

    req.on('error', reject);
  });
}

function runPostDemo() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ title: 'Node TCP HTTP' });
    const req = TcpHttpClient.request(
      'http://127.0.0.1:3001/books',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        const chunks = [];

        console.log('POST status:', res.statusCode);

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          console.log('POST body:', Buffer.concat(chunks).toString('utf8'));
          resolve();
        });
      }
    );

    req.on('error', reject);
    req.end(body);
  });
}
