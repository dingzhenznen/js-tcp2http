tcp 是传输协议，http 协议在tcp 的基础上 建立了http 协议来规定 请求方式 请求头 请求体 ，以及 client sever 怎么处理数据，
  可以这么理解吗


• 可以，这个理解是对的。

  更准确地说：

  TCP 负责可靠传输字节流
  HTTP 规定这些字节应该按什么格式组织、发送、解析和响应

  TCP 只管：

  连接建立
  可靠传输
  顺序保证
  丢包重传
  流量控制
  拥塞控制
  连接关闭

  但 TCP 不知道：

  GET 是什么
  POST 是什么
  Header 是什么
  Body 是什么
  状态码 200 是什么
  Content-Type 是什么

  这些都是 HTTP 协议定义的。

  HTTP 在 TCP 之上规定了：

  请求行：GET /users HTTP/1.1
  请求头：Host、Content-Type、Content-Length
  空行：\r\n
  请求体：JSON、表单、文件等

  响应行：HTTP/1.1 200 OK
  响应头：Content-Type、Content-Length
  空行：\r\n
  响应体：HTML、JSON、图片等

  比如客户端实际写入 TCP 的是：

  POST /users HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json
  Content-Length: 14

  {"name":"tom"}

  服务端实际写回 TCP 的是：

  HTTP/1.1 200 OK
  Content-Type: application/json
  Content-Length: 11

  {"ok":true}

  所以可以这样理解：

  TCP = 管道，只保证字节可靠送到
  HTTP = 管道里传的内容格式和通信规则

  Node 里对应关系是：

  net.Socket
    -> 只提供 TCP 收发字节

  http.request / express
    -> 在 TCP 字节流上解析和生成 HTTP 报文

  一句话：

  HTTP 是建立在 TCP 字节流之上的应用层协议，它规定了请求方法、URL、请求头、请求体、状态码、响应头、响应体等格式，以及客户端
  和服务端如何按这些规则通信。