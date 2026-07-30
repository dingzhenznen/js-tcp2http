文本文件和二进制文件本质都是字节，通过tcp 传输的时候为什么还要 通过file.read转成 buffer 再传输


• 因为 TCP 只能发送内存里的数据，不能直接发送“磁盘上的文件”。

  文件虽然本质是字节，但这些字节一开始在磁盘里：

  磁盘文件
    ↓ fs.readFile / fs.createReadStream
  内存中的 Buffer / chunk
    ↓ socket.write / res.end
  TCP 发送

  fs.readFileSync('./a.png') 的作用不是把文件“变成字节”，而是：

  把磁盘里的字节读取到内存中，用 Buffer 表示。

  然后才能交给：

  socket.write(buffer)

  或者：

  res.end(buffer)

  如果是大文件，不一定要一次性读成完整 Buffer，可以用 stream：

  fs.createReadStream('./a.png').pipe(res);

  这时流程是：

  磁盘文件字节
    ↓ 分块读取
  Buffer chunk
    ↓ 写入 res/socket
  TCP 发送

  所以重点是：

  - 文件本身是磁盘上的字节
  - 网络发送需要内存中的字节
  - Buffer 是 Node.js 表示内存中字节的对象
  - stream 是分块读取 Buffer 并发送的方式

  一句话：

  不是为了“转换成字节”，而是为了“把文件字节从磁盘读到内存，再交给 TCP 发送”。