mysql 连接池和这个 原理应该差不多吧


• 是的，原理很像，都属于“连接池”。

  核心思想一样：

  创建连接很贵
  不要每次用完就销毁
  把连接保留起来
  下次请求复用
  连接不够时排队
  超过限制时等待或报错

  对应关系大概是：

  http.Agent.sockets       -> MySQL pool 中正在使用的连接
  http.Agent.freeSockets   -> MySQL pool 中空闲可复用的连接
  http.Agent.requests      -> 等待可用连接的请求队列
  maxSockets               -> connectionLimit / max connections

  比如 MySQL 连接池：

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'xxx',
    database: 'test',
    connectionLimit: 10
  })

  当有 20 个 SQL 查询同时来：

  前 10 个查询拿到 MySQL 连接
  后 10 个查询进入等待队列
  某个查询执行完，连接释放回池子
  等待队列中的下一个查询拿到这个连接继续执行

  和 http.Agent 的：

  maxSockets: 3
  10 个 HTTP 请求并发
  3 个拿到 socket
  7 个进入 agent.requests
  socket 空闲后继续处理等待请求

  非常类似。

  区别主要是：

  http.Agent 管的是 TCP socket，用来发 HTTP 请求
  MySQL 连接池管的是数据库连接，用来执行 SQL

  还有一个重要区别：

  MySQL 连接有会话状态，比如：

  SET autocommit = 0;
  START TRANSACTION;
  SET @user_id = 123;
  USE database_name;

  所以 MySQL 连接放回池子前，要特别注意：

  事务要提交或回滚
  临时状态要清理
  连接异常要丢弃

  否则下一个请求复用这条连接时，可能继承上一个请求留下的状态。

  一句话：

  MySQL 连接池和 http.Agent 的池化思想基本一样；
  都是“限制连接数量 + 复用空闲连接 + 请求排队”