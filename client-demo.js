import { TcpHttpClient } from './tcp-http-client.js';

const client = new TcpHttpClient();

const getResponse = await client.get('http://localhost:3000/users?name=tom');
console.log('GET status:', getResponse.statusCode);
console.log('GET body:', getResponse.body);

const postResponse = await client.post(
  'http://localhost:3000/users',
  { name: 'tom', age: 18 },
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

console.log('POST status:', postResponse);

console.log('POST status:', postResponse.statusCode);
console.log('POST body:', postResponse.body);
