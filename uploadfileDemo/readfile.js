import fs from 'node:fs';

const data = fs.readFileSync('./a.png');

console.log(Buffer.isBuffer(data)); // true

//如果指定编码，才会返回字符串：

const text = fs.readFileSync('./a.txt', 'utf8');

console.log(typeof text); // string