import TcpHttpClient from './tcp-http-client.js';

await runGetDemo();
await runConnectDemo();

function runGetDemo() {
  return new Promise((resolve, reject) => {
    const req = TcpHttpClient.get('http://127.0.0.1:3001/books?id=1', (res) => {
      console.log('GET status:', res.statusCode);

      res.on('data', (chunk) => {
        console.log('GET body:', chunk.toString());
      });

      res.on('end', () => {
        console.log('GET done');
        resolve();
      });
    });

    req.on('socket', (socket) => {
      console.log('GET socket:', socket.constructor.name);
    });

    req.on('tcpConnect', () => {
      console.log('GET TCP connected');
    });

    req.on('error', reject);
  });
}

function runConnectDemo() {
  return new Promise((resolve, reject) => {
    const req = TcpHttpClient.request({
      hostname: '127.0.0.1',
      port: 3001,
      method: 'CONNECT',
      path: 'www.google.com:80'
    });

    req.on('connect', (res, socket, head) => {
      console.log('CONNECT status:', res.statusCode);
      console.log('CONNECT socket:', socket.constructor.name);
      console.log('CONNECT head bytes:', head.length);

      socket.write(
        'GET / HTTP/1.1\r\n' +
          'Host: www.google.com:80\r\n' +
          'Connection: close\r\n' +
          '\r\n'
      );

      socket.on('data', (chunk) => {
        console.log('CONNECT tunnel data:', chunk.toString());
      });

      socket.on('end', () => {
        console.log('CONNECT done');
        resolve();
      });

      socket.on('error', reject);
    });

    req.on('error', reject);
    req.end();
  });
}
