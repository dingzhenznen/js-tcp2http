import net from 'node:net';

export class TcpHttpClient {
  async request(url, options = {}) {
    const target = typeof url === 'string' ? new URL(url) : url;

    if (target.protocol !== 'http:') {
      throw new Error(`Only http: URLs are supported, received ${target.protocol}`);
    }

    const method = options.method ?? 'GET';
    const hostname = options.hostname ?? target.hostname;
    const targetPort = target.port || 80;
    const port = Number(options.port ?? targetPort);
    const path = `${target.pathname || '/'}${target.search || ''}`;
    const body = normalizeBody(options.body);
    const headers = normalizeHeaders(options.headers);

    headers.host ??= target.port ? `${target.hostname}:${target.port}` : target.hostname;
    headers.connection ??= 'close';

    if (body && headers['content-length'] === undefined) {
      headers['content-length'] = Buffer.byteLength(body);
    }

    const requestText = buildRequestText(method, path, headers, body);
    const responseBuffer = await sendByTcp({ hostname, port, requestText });

    return parseHttpResponse(responseBuffer);
  }

  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  post(url, body, options = {}) {
    return this.request(url, { ...options, method: 'POST', body });
  }
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

function buildRequestText(method, path, headers, body) {
  const lines = [`${method.toUpperCase()} ${path} HTTP/1.1`];

  for (const [key, value] of Object.entries(headers)) {
    lines.push(`${formatHeaderName(key)}: ${value}`);
  }

  return Buffer.concat([
    Buffer.from(`${lines.join('\r\n')}\r\n\r\n`),
    Buffer.isBuffer(body) ? body : Buffer.from(body)
  ]);
}

function formatHeaderName(headerName) {
  return headerName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

function sendByTcp({ hostname, port, requestText }) {
  return new Promise((resolve, reject) => {

    // net.createConnection
    const socket = net.connect({ host: hostname, port });
    // net.connect 源码简化就是 创建 socket = new Socket(options) 然后 socket.connect(args)
    // function connect(...args) {
    //   const socket = new Socket(options);
    //   return socket.connect(args);
    // }

    // net.connect({ host: hostname, port }, () => {
    //   console.log('connected to server');
    // });

    console.log('socket class:', socket.constructor.name);
    console.log('is net.Socket:', socket instanceof net.Socket);
    const chunks = [];

    socket.on('connect', () => {
      socket.write(requestText);
    });

    socket.on('data', (chunk) => {
      chunks.push(chunk);
    });

    socket.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    socket.on('error', reject);
  });
}

function parseHttpResponse(buffer) {
  const headerEnd = buffer.indexOf('\r\n\r\n');

  if (headerEnd === -1) {
    throw new Error('Invalid HTTP response: missing header separator');
  }

  const headerText = buffer.subarray(0, headerEnd).toString('latin1');
  const rawBody = buffer.subarray(headerEnd + 4);
  const [statusLine, ...headerLines] = headerText.split('\r\n');
  const statusMatch = statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})\s*(.*)$/);

  if (!statusMatch) {
    throw new Error(`Invalid HTTP status line: ${statusLine}`);
  }

  const headers = parseHeaders(headerLines);
  const bodyBuffer = decodeBody(rawBody, headers);

  return {
    statusCode: Number(statusMatch[1]),
    statusMessage: statusMatch[2],
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

    if (headers[key] === undefined) {
      headers[key] = value;
    } else if (Array.isArray(headers[key])) {
      headers[key].push(value);
    } else {
      headers[key] = [headers[key], value];
    }
  }

  return headers;
}

function decodeBody(rawBody, headers) {
  if (headers['transfer-encoding']?.toLowerCase().includes('chunked')) {
    return decodeChunkedBody(rawBody);
  }

  if (headers['content-length'] !== undefined) {
    return rawBody.subarray(0, Number(headers['content-length']));
  }

  return rawBody;
}

function decodeChunkedBody(buffer) {
  const chunks = [];
  let offset = 0;

  while (offset < buffer.length) {
    const lineEnd = buffer.indexOf('\r\n', offset);

    if (lineEnd === -1) {
      throw new Error('Invalid chunked body: missing chunk size end');
    }

    const sizeText = buffer.subarray(offset, lineEnd).toString('ascii');
    const size = Number.parseInt(sizeText, 16);

    if (Number.isNaN(size)) {
      throw new Error(`Invalid chunked body size: ${sizeText}`);
    }

    offset = lineEnd + 2;

    if (size === 0) {
      break;
    }

    chunks.push(buffer.subarray(offset, offset + size));
    offset += size + 2;
  }

  return Buffer.concat(chunks);
}
