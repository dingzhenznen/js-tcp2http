 图片等二进制使用 buffer 传递，content-type 应该设置成什么


• 图片这类二进制用 Buffer 传递时，Content-Type 要设置成真实图片格式：

  'image/png'
  'image/jpeg'
  'image/gif'
  'image/webp'
  'image/svg+xml'

  例如 PNG：

  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': buffer.length
  });
  res.end(buffer);

  JPEG：

  res.writeHead(200, {
    'Content-Type': 'image/jpeg',
    'Content-Length': buffer.length
  });
  res.end(buffer);

  如果你不知道具体格式，或者只是希望浏览器当作下载文件处理，可以用：

  'application/octet-stream'

  通常下载时还会加：

  'Content-Disposition': 'attachment; filename="a.png"'

  总结：

  - 已知图片类型：用 image/png、image/jpeg 等
  - 泛二进制/强制下载：用 application/octet-stream
  - 想让浏览器下载：加 Content-Disposition: attachment