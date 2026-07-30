// 方式 1：指定编码，data 事件直接拿字符串：

import fs from 'node:fs';

const stream = fs.createReadStream('./a.txt', {
  encoding: 'utf8'
});

let text = '';

stream.on('data', (chunk) => {
  text += chunk; // chunk 是 string
});

stream.on('end', () => {
  console.log(text);
});

方式 2：不指定编码，先收集 Buffer，再转字符串：

import fs from 'node:fs';

const stream = fs.createReadStream('./a.txt');
const chunks = [];

stream.on('data', (chunk) => {
  chunks.push(chunk); // chunk 是 Buffer
});

stream.on('end', () => {
  const buffer = Buffer.concat(chunks);
  const text = buffer.toString('utf8');

  console.log(text);
});

如果只是小文本文件，直接用这个更简单：

const text = fs.readFileSync('./a.txt', 'utf8');

大文件才更适合用 stream。