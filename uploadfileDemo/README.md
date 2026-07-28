# uploadfileDemo

一个最小的 HTTP 文件上传示例，用来理解：

- `multipart/form-data`
- 原始二进制上传 `application/octet-stream`
- 服务端如何从 TCP 字节流里把请求体读出来并保存成文件

## 启动

```bash
node server.js
```

默认监听：

```text
http://127.0.0.1:3002
```

## 接口

- `GET /`  
  打开上传页面

- `POST /upload`  
  接收 `multipart/form-data`

- `POST /upload-raw?filename=demo.bin`  
  接收原始二进制流

- `GET /uploads`  
  查看已保存的文件

## 文件说明

- `server.js`：上传服务端
- `node-formdata.js`：Node 里用 `FormData` 上传的示例
- `上传文件格式.md`：multipart/form-data 请求体结构笔记
- `uploads/`：上传成功后保存文件的目录

## 测试方式

浏览器打开：

```text
http://127.0.0.1:3002/
```

或者用命令行：

```bash
curl -F "username=tom" -F "file=@/path/to/file.png" http://127.0.0.1:3002/upload
```

原始二进制上传：

```bash
curl --data-binary @./a.png -H "Content-Type: application/octet-stream" \
  "http://127.0.0.1:3002/upload-raw?filename=a.png"
```
