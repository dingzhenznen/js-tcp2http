const form = new FormData();
form.append('username', 'tom');
form.append('file', fileBuffer, {
  filename: 'a.png',
  contentType: 'image/png'
});



form.append('file', fs.createReadStream('./a.png'))


注意点：Buffer 只是文件内容字节，本身没有文件名，所以要手动传 filename。否则 multipart
  里可能不会出现 filename="a.png"，服务端就不一定把它识别成文件。语法检查已通过。




  主要区别是：流式读取 vs 一次性读入内存。

  fs.createReadStream('./a.png')：

  - 不会一次性把整个文件读进内存
  - 按块读取文件内容
  - 适合大文件
  - 上传时可以边读边发
  - 内存占用低
  - form-data 通常可以从 stream 上拿到文件路径/文件名信息

  form.append('file', fs.createReadStream('./a.png'));

  fs.readFileSync('./a.png') + Buffer：

  - 会一次性把整个文件读进内存
  - 文件越大，占用内存越高
  - 适合小文件、已经在内存里的数据
  - 上传时 body 数据来自已有 Buffer
  - 需要手动传 filename、contentType

  const fileBuffer = fs.readFileSync('./a.png');

  form.append('file', fileBuffer, {
    filename: 'a.png',
    contentType: 'image/png'
  });

  一句话：

  - 大文件优先用 stream
  - 小文件或内存中已有数据可以用 Buffer

  最终发送到 HTTP 请求体里，两者都会变成 multipart/form-data 的文件 part，里面放的都是文
  件字节。