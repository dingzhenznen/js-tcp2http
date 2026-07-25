你当前 Node 版本是 v22.12.0。本机看到的 net.connect({ host, port }) 源码入口是：

  function connect(...args) {
    const normalized = normalizeArgs(args);
    const options = normalized[0];
    debug('createConnection', normalized);
    const socket = new Socket(options);

    if (netClientSocketChannel.hasSubscribers) {
      netClientSocketChannel.publish({
        socket,
      });
    }

    if (options.timeout) {
      socket.setTimeout(options.timeout);
    }

    return socket.connect(normalized);
  }

  并且验证了：

  require('node:net').createConnection === require('node:net').connect
  // true

  所以：

  net.connect === net.createConnection

  它做的事就是：

  1. normalizeArgs(args)
     把 { host, port } 标准化成内部 options

  2. const socket = new Socket(options)
     创建一个 net.Socket 实例

  3. 如果传了 timeout
     socket.setTimeout(options.timeout)

  4. return socket.connect(normalized)
     调用 socket.connect 真正发起连接

  Socket.prototype.connect 的关键源码是：

  function(...args) {
    let normalized;

    if (ArrayIsArray(args[0]) && args[0][normalizedArgsSymbol]) {
      normalized = args[0];
    } else {
      normalized = normalizeArgs(args);
    }

    const options = normalized[0];
    const cb = normalized[1];

    if (cb !== null) {
      this.once('connect', cb);
    }

    if (options.port === undefined && options.path == null)
      throw new ERR_MISSING_ARGS(['options', 'port', 'path']);

    const { path } = options;
    const pipe = !!path;

    if (!this._handle) {
      this._handle = pipe ?
        new Pipe(PipeConstants.SOCKET) :
        new TCP(TCPConstants.SOCKET);
      initSocketHandle(this);
    }

    this.connecting = true;

    if (pipe) {
      defaultTriggerAsyncIdScope(
        this[async_id_symbol], internalConnect, this, path,
      );
    } else {
      lookupAndConnect(this, options);
    }

    return this;
  }

  重点是这段：

  this._handle = pipe
    ? new Pipe(PipeConstants.SOCKET)
    : new TCP(TCPConstants.SOCKET);

  如果你传的是：

  net.connect({ host: hostname, port })

  没有 path，所以：

  pipe = false

  new TCP(TCPConstants.SOCKET)

  接着走：

  lookupAndConnect(this, options)

  也就是解析 host，然后发起 TCP 连接。

  一句话：

  net.connect({ host, port }) 本质上就是 new net.Socket()，创建底层 TCP handle，然后调用 socket.connect() 去解析地址并建立
  TCP 连接。

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────


› tcp 三次握手 是通过socket.connect 来实现的吗


• 从 Node.js 代码层面看，可以这么说：

  socket.connect() 触发建立 TCP 连接

  但更准确地说：

  TCP 三次握手不是 JS 自己实现的
  socket.connect() 只是调用操作系统的 connect 系统调用
  真正的三次握手由操作系统 TCP/IP 协议栈完成

  流程大概是：

  Node.js socket.connect()
    -> libuv
    -> 操作系统 connect()
    -> OS TCP 协议栈发送 SYN
    -> 服务端回复 SYN + ACK
    -> 客户端回复 ACK
    -> TCP 连接建立成功
    -> Node 触发 socket 的 'connect' 事件

  所以：

  const socket = net.connect({ host: 'localhost', port: 3000 });

  socket.on('connect', () => {
    console.log('TCP connected');
  });

  这里的 'connect' 事件触发时，说明 TCP 三次握手已经成功完成了。

  对应关系：

  socket.connect()：发起连接
  TCP 三次握手：操作系统完成
  'connect' 事件：握手成功后 Node 通知你

  如果握手失败，比如端口没开、防火墙拒绝、超时，会触发：

  socket.on('error', (err) => {
    console.log(err.code);
  });

  例如：

  ECONNREFUSED
  ETIMEDOUT
  ENETUNREACH

  一句话：

  socket.connect() 负责“发起 TCP 连接请求”，三次握手由操作系统 TCP 协议栈完成，成功后 Node.js 才触发 socket 的 connect 事
  件。