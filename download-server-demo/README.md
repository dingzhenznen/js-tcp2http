# download-server-demo

HTTP 下载与 `Content-Type` 处理示例。

这个目录主要用来演示：

- `application/octet-stream` 文件下载
- `image/png` 图片下载
- `Content-Length` 和 `Transfer-Encoding: chunked`
- 接收端如何根据响应头处理 body

## 启动

```bash
node download-contenttype-server.js
```

默认监听：

```text
http://127.0.0.1:3001
```

## 路由

- `GET /`  
  首页入口

- `GET /download`  
  下载文本文件，返回 `application/octet-stream`

- `GET /download-image`  
  下载 PNG 图片，返回 `image/png`

- `GET /download-stream`  
  流式下载，使用分块写入

## 文件说明

- `download-contenttype-server.js`：下载 demo 服务端
- `重要--http-tcp接受数据--content-type处理.md`：HTTP / TCP / Content-Type 笔记

## 测试

```bash
curl -iS http://127.0.0.1:3001/download
curl -iS http://127.0.0.1:3001/download-image
curl -iS http://127.0.0.1:3001/download-stream
```
