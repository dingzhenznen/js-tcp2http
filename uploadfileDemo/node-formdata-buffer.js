import fs from 'node:fs';
import FormData from 'form-data';

const fileBuffer = fs.readFileSync('./a.png');

const form = new FormData();
form.append('username', 'tom');
form.append('file', fileBuffer, {
  filename: 'a.png',
  contentType: 'image/png'
});

const res = await fetch('http://127.0.0.1:3002/upload', {
  method: 'POST',
  body: form
});

console.log(await res.json());
