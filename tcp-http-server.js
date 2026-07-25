import net from 'node:net';
import { EventEmitter } from 'node:events';

export class TcpHttpServer {
  constructor(handler) {
    this.handler = handler;
    this.server = net.createServer((socket) => {
      this.handleSocket(socket);
    });
  }

  listen(port, host = '0.0.0.0', callback) {
    this.server.listen(port, host, callback);
  }

  close(callback) {
    this.server.close(callback);
  }

  handleSocket(socket) {
    const chunks = [];

    socket.on('data', (chunk) => {
      chunks.push(chunk);
      const requestBuffer = Buffer.concat(chunks);
      const request = parseHttpRequest(requestBuffer);

      if (!request.complete) {
        return;
      }

      try {
        const req = new TcpIncomingMessage(request);
        const res = new TcpServerResponse(socket);

        this.handler(req, res);
        req.emitBody();
      } catch (error) {
        socket.end(
          buildHttpResponse({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
          })
        );
      }
    });

    socket.on('error', (error) => {
      console.error('socket error:', error.message);
    });
  }
}

class TcpIncomingMessage extends EventEmitter {
  constructor(request) {
    super();
    this.method = request.method;
    this.url = request.url;
    this.httpVersion = request.httpVersion;
    this.headers = request.headers;
    this.body = request.body;
    this.bodyBuffer = request.bodyBuffer;
  }

  emitBody() {
    if (this.bodyBuffer.length > 0) {
      this.emit('data', this.bodyBuffer);
    }

    this.emit('end');
  }
}

class TcpServerResponse {
  constructor(socket) {
    this.socket = socket;
    this.statusCode = 200;
    this.statusMessage = 'OK';
    this.headers = {};
    this.ended = false;
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  getHeader(name) {
    return this.headers[name];
  }

  end(body = '') {
    if (this.ended) {
      return;
    }

    this.ended = true;
    this.socket.end(
      buildHttpResponse({
        statusCode: this.statusCode,
        statusMessage: this.statusMessage,
        headers: this.headers,
        body
      })
    );
  }
}

function parseHttpRequest(buffer) {
  const headerEnd = buffer.indexOf('\r\n\r\n');

  if (headerEnd === -1) {
    return { complete: false };
  }

  const headerText = buffer.subarray(0, headerEnd).toString('latin1');
  const [requestLine, ...headerLines] = headerText.split('\r\n');
  const [method, url, httpVersion] = requestLine.split(' ');
  const headers = parseHeaders(headerLines);
  const bodyStart = headerEnd + 4;
  const contentLength = Number(headers['content-length'] ?? 0);
  const fullLength = bodyStart + contentLength;

  if (buffer.length < fullLength) {
    return { complete: false };
  }

  const bodyBuffer = buffer.subarray(bodyStart, fullLength);

  return {
    complete: true,
    method,
    url,
    httpVersion,
    headers,
    body: bodyBuffer.toString('utf8'),
    bodyBuffer
  };
}

function parseHeaders(headerLines) {
  const headers = {};

  for (const line of headerLines) {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    headers[key] = value;
  }

  return headers;
}

function buildHttpResponse(response) {
  const statusCode = response.statusCode ?? 200;
  const statusMessage = response.statusMessage ?? 'OK';
  const body = normalizeBody(response.body);
  const headers = normalizeHeaders(response.headers);

  headers['content-length'] = Buffer.byteLength(body);
  headers.connection ??= 'close';

  const lines = [`HTTP/1.1 ${statusCode} ${statusMessage}`];

  for (const [key, value] of Object.entries(headers)) {
    lines.push(`${formatHeaderName(key)}: ${value}`);
  }

  return Buffer.concat([
    Buffer.from(`${lines.join('\r\n')}\r\n\r\n`),
    Buffer.isBuffer(body) ? body : Buffer.from(body)
  ]);
}

function normalizeBody(body) {
  if (body === undefined || body === null) {
    return '';
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body);
}

function normalizeHeaders(headers = {}) {
  const normalized = {};

  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }

  return normalized;
}

function formatHeaderName(headerName) {
  return headerName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}
