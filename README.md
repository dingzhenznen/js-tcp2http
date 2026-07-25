# js-tcp2http

这个项目用 `node:net` 手动实现一个简化版 HTTP 客户端和 HTTP 服务端，用来理解：

- TCP 只负责传输字节流
- HTTP 报文是写入 TCP 的一段文本/字节
- Node 的 `http.request` / `http.createServer` 本质上是在 TCP 上封装 HTTP 协议解析和生成

## 文件说明

```text
tcp-http-client.js    用 net.connect 实现的简化 HTTP client
client-demo.js        使用 TcpHttpClient 请求 node:http 服务端

tcp-http-server.js    用 net.createServer 实现的简化 HTTP server
tcp-server-start.js   启动 TcpHttpServer，写法类似 http.createServer((req, res) => {})
tcp-server-demo.js    使用 TcpHttpClient 请求 TcpHttpServer

server.js             使用 node:http.createServer 的标准 HTTP server，对照用
```

## 运行 node:http 对照 demo

启动 Node 原生 HTTP server：

```bash
npm run server
```

另开终端，用 `TcpHttpClient` 请求它：

```bash
npm run demo
```

这组 demo 说明：

```text
自定义 TCP HTTP client -> node:http server
```

## 运行 net 实现的 HTTP server demo

启动自定义 TCP HTTP server：

```bash
npm run tcp-server
```

另开终端，用 `TcpHttpClient` 请求它：

```bash
npm run tcp-server-demo
```

这组 demo 说明：

```text
自定义 TCP HTTP client -> 自定义 TCP HTTP server
```

## Client 用法

```js
import { TcpHttpClient } from './tcp-http-client.js';

const client = new TcpHttpClient();

const response = await client.post(
  'http://localhost:3000/users',
  { name: 'tom' },
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

console.log(response.statusCode);
console.log(response.headers);
console.log(response.body);
```

`TcpHttpClient` 做的事情：

```text
1. net.connect({ host, port }) 建立 TCP 连接
2. 手动拼接 HTTP 请求报文
3. socket.write(requestBuffer) 发送请求
4. socket.on('data') 接收响应字节
5. 解析响应行、headers、body
```

## Server 用法

`TcpHttpServer` 的使用方式接近 `http.createServer`：

```js
import { TcpHttpServer } from './tcp-http-server.js';

const server = new TcpHttpServer((req, res) => {
  const chunks = [];

  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body ? JSON.parse(body) : null
      })
    );
  });
});

server.listen(3001, '127.0.0.1');
```

`TcpHttpServer` 做的事情：

```text
1. net.createServer 创建 TCP server
2. socket.on('data') 接收客户端字节
3. 解析 HTTP 请求行、headers、body
4. 构造 req/res 对象
5. res.end(body) 手动拼接 HTTP 响应报文并 socket.end(responseBuffer)
```

## HTTP 报文示意

POST 请求本质上是写入 TCP 的一段字节：

```http
POST /users HTTP/1.1
Host: localhost:3000
Connection: close
Content-Type: application/json
Content-Length: 14

{"name":"tom"}
```

服务端返回的响应也是 TCP 里的字节：

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 11
Connection: close

{"ok":true}
```

## 限制

这是学习用的简化实现，不是完整 HTTP 实现。当前只覆盖：

- HTTP/1.1 基础请求/响应
- `Content-Length`
- 简单 `chunked` 响应解析
- 短连接 `Connection: close`

没有完整支持 HTTPS、连接复用、HTTP pipelining、HTTP/2、复杂 chunk trailer、压缩解码等能力。
