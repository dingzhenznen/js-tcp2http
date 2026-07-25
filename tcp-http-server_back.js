import net from 'node:net';

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

    socket.on('data', async (chunk) => {
      chunks.push(chunk);
      const requestBuffer = Buffer.concat(chunks);
      const request = parseHttpRequest(requestBuffer);

      if (!request.complete) {
        return;
      }

      try {
        const response = await this.handler(request);
        socket.end(buildHttpResponse(response));
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
