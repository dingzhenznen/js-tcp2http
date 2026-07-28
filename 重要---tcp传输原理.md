https://www.runoob.com/np/tcp-protocol.html
  https://www.nodeapp.cn/net.html
  tcp 的 不丢失、不重复，并且按顺序到达 ，在node 中是通过 socket 来实现的吗


• Searching the web

• Searched https://www.runoob.com/np/tcp-protocol.html

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

• 可以这么理解，但要更精确一点：

  TCP 的“不丢失、不重复、按顺序到达”
  不是 Node.js 的 socket 用 JS 代码实现的；
  而是操作系统内核里的 TCP/IP 协议栈实现的。

  Node 的 net.Socket 是对底层 TCP 连接的封装。Node 文档里说 net 模块提供基于流的 TCP/IPC server 和 client API；也就
  是说，你在 Node 里通过 net.Socket 使用 TCP 能力。来源：Node net 文档。
  https://www.nodeapp.cn/net.html

  真正保证可靠性的是 TCP 协议本身，例如：

  序列号
  确认号 ACK
  超时重传
  去重
  按序重组
  滑动窗口
  流量控制
  拥塞控制
  校验和

  菜鸟教程里也提到，TCP 是可靠、面向连接、基于字节流的传输服务，并通过确认、重传、流量控制等机制保证可靠传输。
  https://www.runoob.com/np/tcp-protocol.html

  所以在 Node 中的层次是：

  你的 JS 代码
    -> net.Socket
    -> libuv / 系统调用
    -> 操作系统 TCP 协议栈
    -> 网卡 / 网络

  你写：

  socket.write('hello');

  不是 Node 自己去实现：

  拆包
  编号
  ACK
  重传
  去重
  排序

  而是把数据交给操作系统：

  Node 调用系统 socket API
  操作系统 TCP 协议栈负责可靠传输

  接收端：

  socket.on('data', (chunk) => {
    console.log(chunk);
  });

  这里拿到的数据，已经是操作系统 TCP 协议栈处理后的有序字节流。

  要注意一个点：

  TCP 保证字节流有序可靠
  但不保证你 write 一次，对方 data 就收到一次

  例如：

  socket.write('hello');
  socket.write('world');

  对方可能收到：

  一次 data: helloworld

  也可能收到：

  第一次 data: hel
  第二次 data: loworld

  这叫 TCP 是字节流协议，没有消息边界。

  一句话：

  在 Node 里你通过 net.Socket 使用 TCP；可靠、有序、不重复是操作系统 TCP 协议栈提供的能力，socket 只是把这个能力暴
  露成可读写的双工流 API。