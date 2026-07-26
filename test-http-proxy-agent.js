import * as http from 'http';
import { HttpProxyAgent } from 'http-proxy-agent';

const agent = new HttpProxyAgent('http://127.0.0.1:7897');

const req = http.get('http://httpbin.org/ip', { agent }, (res) => {
  let body = '';

  res.setEncoding('utf8');

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);
    console.log('body:', body);

    try {
      const data = JSON.parse(body);
      console.log('origin ip:', data.origin);
    } catch {
      console.log('body 不是 JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('请求失败:', error.message);
});
