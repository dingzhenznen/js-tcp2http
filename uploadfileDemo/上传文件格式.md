POST /upload HTTP/1.1
  Content-Type: multipart/form-data; boundary=----abc123

  ------abc123
  Content-Disposition: form-data; name="username"

  tom
  ------abc123
  Content-Disposition: form-data; name="file"; filename="a.png"
  Content-Type: image/png

  ...这里是图片二进制...
  ------abc123--

  对应关系：

  - username 这一段是 字段 part
  - file 这一段是 文件 part
  - boundary 用来分隔每个 part
  - 每个 part 自己还能带头，比如 Content-Disposition、Content-Type

  在你现在的代码里：

  - part.name 对应字段名
  - part.filename 有值时，就是文件
  - part.content 是这一段真正的数据

  所以 parseMultipart(...) 返回的是“所有 part”，不是“所有文件”。