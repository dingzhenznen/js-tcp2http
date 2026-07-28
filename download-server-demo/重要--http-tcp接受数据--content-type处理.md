# HTTP / TCP 接收数据处理总结

## 1. 图片和二进制流是不是通过 TCP 传输

不是所有 HTTP 都一定走 TCP。

- `HTTP/1.1` 和 `HTTP/2` 通常通过 `TCP` 传输
- `HTTP/3` 通过 `QUIC/UDP` 传输

图片、文件、二进制流本质上都是 HTTP body 里的字节数据，底层是否是 TCP，取决于使用的 HTTP 版本。

## 2. `Content-Type` 的作用

`Content-Type` 只负责说明 body 的数据格式，不负责传输。

常见值：

- `image/png`
- `image/jpeg`
- `application/json`
- `application/octet-stream`

接收端通常根据 `Content-Type` 决定如何解析 body，比如按图片、JSON 或原始二进制处理。

## 3. 接收端处理 HTTP 响应的顺序

接收端不是先看 `Content-Type`，而是先完成 HTTP 解析：

1. 从 TCP 字节流中读取响应头
2. 找到头部结束位置
3. 根据 `Content-Length`、`Transfer-Encoding: chunked` 等规则确定 body 边界
4. 取出 body
5. 再根据 `Content-Type` 解释 body 内容

## 4. HTTP 如何处理粘包和拆包

TCP 是字节流，没有消息边界，所以会出现：

- 拆包：一次 HTTP 数据被分多次收到
- 粘包：多次 HTTP 数据一次收到

HTTP 通过协议规则来切分消息，而不是依赖 TCP 包边界。

### 常见边界方式

- `Content-Length`：明确 body 总长度，读满就结束
- `Transfer-Encoding: chunked`：按块传输，每块前面带长度
- 连接关闭：少数场景下靠关闭连接表示 body 结束

## 5. `Content-Length` 示例

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 18

{"ok":true,"n":1}
```

处理过程：

- 先读头
- 看到 `Content-Length: 18`
- 再从 TCP 流里读取 18 字节 body
- 最后根据 `Content-Type` 按 JSON 解析

## 6. `chunked` 示例

```http
HTTP/1.1 200 OK
Transfer-Encoding: chunked

5
hello
5
world
0
```

处理过程：

- 先读响应头
- 发现是 `chunked`
- 读取每个 chunk 前面的长度
- 读取对应长度的数据
- 遇到 `0` 表示结束

## 7. 一句话总结

- `TCP` 负责可靠传字节
- `HTTP` 负责定义消息边界
- `Content-Type` 负责说明 body 是什么格式

HTTP 不是消灭粘包拆包，而是通过 `Content-Length`、`chunked` 等规则，把 TCP 字节流还原成一条条完整消息。
