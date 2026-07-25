import { TcpHttpClient } from './tcp-http-client.js';

const client = new TcpHttpClient();

const getResponse = await client.get('http://127.0.0.1:3001/books?id=1');
console.log('GET status:', getResponse.statusCode);
console.log('GET body:', getResponse.body);

const postResponse = await client.post(
  'http://127.0.0.1:3001/books',
  { title: 'Node TCP HTTP' },
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

console.log('POST status:', postResponse.statusCode);
console.log('POST body:', postResponse.body);
