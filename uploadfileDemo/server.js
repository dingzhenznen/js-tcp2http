import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');
const port = 3002;

fs.mkdirSync(uploadDir, { recursive: true });

function sendHtml(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseContentDisposition(value = '') {
  const result = {};
  for (const part of value.split(';')) {
    const item = part.trim();
    const [key, rawVal] = item.split('=');
    if (!rawVal) continue;
    result[key] = rawVal.replace(/^"|"$/g, '');
  }
  return result;
}

function parseMultipart(body, boundary) {
  const boundaryToken = Buffer.from(`--${boundary}`);
  const separator = Buffer.from(`\r\n--${boundary}`);
  const headerSeparator = Buffer.from('\r\n\r\n');
  const parts = [];

  let cursor = body.indexOf(boundaryToken);
  if (cursor === -1) return parts;

  cursor += boundaryToken.length + 2;

  while (cursor < body.length) {
    if (body.slice(cursor, cursor + 2).equals(Buffer.from('\r\n'))) {
      cursor += 2;
    }

    const headersEnd = body.indexOf(headerSeparator, cursor);
    if (headersEnd === -1) break;

    const headersText = body.slice(cursor, headersEnd).toString('utf8');
    const headers = {};

    for (const line of headersText.split('\r\n')) {
      const index = line.indexOf(':');
      if (index === -1) continue;
      const key = line.slice(0, index).trim().toLowerCase();
      const value = line.slice(index + 1).trim();
      headers[key] = value;
    }

    const contentStart = headersEnd + headerSeparator.length;
    const nextBoundary = body.indexOf(separator, contentStart);
    if (nextBoundary === -1) break;

    const content = body.slice(contentStart, nextBoundary);
    const disposition = parseContentDisposition(headers['content-disposition']);

    parts.push({
      headers,
      name: disposition.name || '',
      filename: disposition.filename || '',
      contentType: headers['content-type'] || 'text/plain',
      content
    });

    const afterBoundary = nextBoundary + 2 + boundaryToken.length;
    const isFinal = body.slice(afterBoundary, afterBoundary + 2).equals(Buffer.from('--'));
    if (isFinal) break;

    cursor = afterBoundary + 2;
  }

  return parts;
}

function getUploadPage() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>upload demo</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; max-width: 900px; margin: 0 auto; }
      form { padding: 16px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 16px; }
      input, button { font: inherit; }
      pre { background: #f6f8fa; padding: 12px; border-radius: 8px; overflow: auto; }
    </style>
  </head>
  <body>
    <h1>文件上传 demo</h1>

    <form action="/upload" method="post" enctype="multipart/form-data">
      <p>
        <label>username <input name="username" value="tom" /></label>
      </p>
      <p>
        <label>file <input type="file" name="file" /></label>
      </p>
      <button type="submit">上传文件</button>
    </form>

    <form action="/upload-raw?filename=demo.bin" method="post" enctype="application/octet-stream">
      <p>这个接口演示原始二进制上传，body 就是一段 bytes。</p>
      <button type="submit">提交空的 raw 请求</button>
    </form>

    <p>你也可以直接用 curl 测试：</p>
    <pre>curl -F "username=tom" -F "file=@/path/to/file.png" http://127.0.0.1:3002/upload</pre>
  </body>
</html>`;
}

function saveFile(filename, buffer) {
  const safeName = filename.replaceAll('/', '_').replaceAll('\\', '_') || 'upload.bin';
  const finalName = `${Date.now()}-${safeName}`;
  const filePath = path.join(uploadDir, finalName);
  fs.writeFileSync(filePath, buffer);
  return { filePath, finalName };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    sendHtml(res, getUploadPage());
    return;
  }

  if (req.method === 'GET' && url.pathname === '/uploads') {
    const files = fs.readdirSync(uploadDir);
    sendHtml(
      res,
      `<!doctype html>
<html lang="zh-CN">
  <head><meta charset="utf-8" /><title>uploads</title></head>
  <body>
    <h1>已保存的文件</h1>
    <ul>
      ${files.map((file) => `<li>${escapeHtml(file)}</li>`).join('')}
    </ul>
  </body>
</html>`
    );
    return;
  }

  if (req.method === 'POST' && url.pathname === '/upload-raw') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const filename = url.searchParams.get('filename') || 'upload.bin';
      const saved = saveFile(filename, body);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          ok: true,
          mode: 'application/octet-stream',
          filename: saved.finalName,
          size: body.length
        }, null, 2)
      );
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/upload') {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=([^;]+)/i);

    if (!contentType.startsWith('multipart/form-data') || !boundaryMatch) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Expected multipart/form-data with boundary');
      return;
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const parts = parseMultipart(body, boundaryMatch[1]);
      const fields = {};
      const files = [];

      for (const part of parts) {
        if (part.filename) {
          const saved = saveFile(part.filename, part.content);
          files.push({
            fieldName: part.name,
            originalName: part.filename,
            savedName: saved.finalName,
            size: part.content.length,
            contentType: part.contentType
          });
        } else if (part.name) {
          fields[part.name] = part.content.toString('utf8');
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify(
          {
            ok: true,
            fields,
            files
          },
          null,
          2
        )
      );
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`upload demo server listening on http://127.0.0.1:${port}`);
  console.log(`open http://127.0.0.1:${port}/`);
  console.log(`saved files are stored in ${uploadDir}`);
});
