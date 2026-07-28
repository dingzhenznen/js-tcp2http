import fs from 'node:fs';
  import FormData from 'form-data';

  const form = new FormData();
  form.append('username', 'tom');
  form.append('file', fs.createReadStream('./a.png'));

  const res = await fetch('http://127.0.0.1:3002/upload', {
    method: 'POST',
    body: form
  });

  console.log(await res.json());