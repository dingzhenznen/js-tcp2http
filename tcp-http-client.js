import net from 'node:net';
import { EventEmitter } from 'node:events';

export function request(urlOrOptions, optionsOrCallback, callback) {
  const { options, cb } = normalizeRequestArgs(urlOrOptions, optionsOrCallback, callback);
  const req = new TcpClientRequest(options);

  if (cb) {
    req.on('response', cb);
  }

  return req;
}

export function get(urlOrOptions, optionsOrCallback, callback) {
  const req = request(
    urlOrOptions,
    withGetMethod(optionsOrCallback),
    typeof optionsOrCallback === 'function' ? optionsOrCallback : callback
  );
  req.end();
  return req;
}



export default {
  request,
  get
};

class TcpClientRequest extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.bodyChunks = [];
    this.ended = false;
    this.connectEmitted = false;
    this.socket = null;
  }

  write(chunk) {
    this.bodyChunks.push(toBuffer(chunk));
  }

  end(chunk) {
    if (chunk !== undefined) {
      this.write(chunk);
    }

    if (this.ended) {
      return;
    }

    this.ended = true;
    this.start();
  }

  start() {
    const body = Buffer.concat(this.bodyChunks);
    const headers = normalizeHeaders(this.options.headers);

    headers.host ??= this.options.hostHeader;
    headers.connection ??= this.options.method === 'CONNECT' ? 'keep-alive' : 'close';

    if (body.length > 0 && headers['content-length'] === undefined) {
      headers['content-length'] = body.length;
    }

    const requestBuffer = buildRequestBuffer(
      this.options.method,
      this.options.path,
      headers,
      body
    );
    const socket = net.connect({ host: this.options.hostname, port: this.options.port });
    const chunks = [];

    this.socket = socket;
    this.emit('socket', socket);

    socket.on('connect', () => {
      this.emit('tcpConnect', socket);
      socket.write(requestBuffer);
    });

    socket.on('data', (chunk) => {
      chunks.push(chunk);

      if (this.options.method === 'CONNECT') {
        this.maybeEmitConnect(Buffer.concat(chunks), socket);
      }
    });

    socket.on('end', () => {
      if (this.options.method === 'CONNECT') {
        return;
      }

      this.emitResponse(Buffer.concat(chunks));
    });

    socket.on('error', (error) => {
      this.emit('error', error);
    });
  }

  maybeEmitConnect(buffer, socket) {
    const headerEnd = buffer.indexOf('\r\n\r\n');

    if (headerEnd === -1 || this.connectEmitted) {
      return;
    }

    this.connectEmitted = true;
    const res = parseHttpResponseHeader(buffer.subarray(0, headerEnd));
    const head = buffer.subarray(headerEnd + 4);
    this.emit('connect', res, socket, head);
  }

  emitResponse(buffer) {
    try {
      const res = parseHttpResponse(buffer);
      this.emit('response', res);
      res.emitBody();
    } catch (error) {
      this.emit('error', error);
    }
  }
}

class TcpIncomingMessage extends EventEmitter {
  constructor({ statusCode, statusMessage, headers, bodyBuffer }) {
    super();
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    this.headers = headers;
    this.bodyBuffer = bodyBuffer;
    this.body = bodyBuffer.toString('utf8');
  }

  emitBody() {
    if (this.bodyBuffer.length > 0) {
      this.emit('data', this.bodyBuffer);
    }

    this.emit('end');
  }
}

function normalizeRequestArgs(urlOrOptions, optionsOrCallback, callback) {
  let options;
  let cb = callback;

  if (typeof urlOrOptions === 'string' || urlOrOptions instanceof URL) {
    const target = typeof urlOrOptions === 'string' ? new URL(urlOrOptions) : urlOrOptions;

    if (target.protocol !== 'http:') {
      throw new Error(`Only http: URLs are supported, received ${target.protocol}`);
    }

    options = {
      ...(typeof optionsOrCallback === 'object' ? optionsOrCallback : {}),
      hostname: target.hostname,
      port: Number(target.port || 80),
      path: `${target.pathname || '/'}${target.search || ''}`,
      hostHeader: target.port ? `${target.hostname}:${target.port}` : target.hostname
    };

    if (typeof optionsOrCallback === 'function') {
      cb = optionsOrCallback;
    }
  } else {
    options = { ...urlOrOptions };

    if (typeof optionsOrCallback === 'function') {
      cb = optionsOrCallback;
    }
  }

  const hostParts = parseHost(options.host);
  const hostname = options.hostname ?? hostParts.hostname ?? 'localhost';
  const port = Number(options.port ?? hostParts.port ?? 80);
  const method = (options.method ?? 'GET').toUpperCase();
  const path = options.path ?? (method === 'CONNECT' ? `${hostname}:${port}` : '/');
  const hostHeader = options.hostHeader ?? options.headers?.host ?? options.headers?.Host ?? buildHostHeader(hostname, port);

  return {
    cb,
    options: {
      ...options,
      hostname,
      port,
      method,
      path,
      hostHeader
    }
  };
}

function parseHost(host) {
  if (!host) {
    return {};
  }

  const [hostname, port] = String(host).split(':');
  return {
    hostname,
    port: port ? Number(port) : undefined
  };
}

function buildHostHeader(hostname, port) {
  return port === 80 ? hostname : `${hostname}:${port}`;
}

function withGetMethod(optionsOrCallback) {
  if (typeof optionsOrCallback === 'function' || optionsOrCallback === undefined) {
    return undefined;
  }

  return { ...optionsOrCallback, method: 'GET' };
}

function normalizeBody(body) {
  if (body === undefined || body === null) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (typeof body === 'string') {
    return Buffer.from(body);
  }

  return Buffer.from(JSON.stringify(body));
}

function normalizeHeaders(headers = {}) {
  const normalized = {};

  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }

  return normalized;
}

function buildRequestBuffer(method, path, headers, body) {
  const lines = [`${method.toUpperCase()} ${path} HTTP/1.1`];

  for (const [key, value] of Object.entries(headers)) {
    lines.push(`${formatHeaderName(key)}: ${value}`);
  }

  return Buffer.concat([Buffer.from(`${lines.join('\r\n')}\r\n\r\n`), toBuffer(body)]);
}

function formatHeaderName(headerName) {
  return headerName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

function parseHttpResponse(buffer) {
  const headerEnd = buffer.indexOf('\r\n\r\n');

  if (headerEnd === -1) {
    throw new Error('Invalid HTTP response: missing header separator');
  }

  const res = parseHttpResponseHeader(buffer.subarray(0, headerEnd));
  const rawBody = buffer.subarray(headerEnd + 4);
  const bodyBuffer = decodeBody(rawBody, res.headers);

  return new TcpIncomingMessage({
    statusCode: res.statusCode,
    statusMessage: res.statusMessage,
    headers: res.headers,
    bodyBuffer
  });
}

function parseHttpResponseHeader(buffer) {
  const headerText = buffer.toString('latin1');
  const [statusLine, ...headerLines] = headerText.split('\r\n');
  const statusMatch = statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})\s*(.*)$/);

  if (!statusMatch) {
    throw new Error(`Invalid HTTP status line: ${statusLine}`);
  }

  return new TcpIncomingMessage({
    statusCode: Number(statusMatch[1]),
    statusMessage: statusMatch[2],
    headers: parseHeaders(headerLines),
    bodyBuffer: Buffer.alloc(0)
  });
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

function toBuffer(value) {
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}
