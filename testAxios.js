import axios from 'axios';

const IP_API_URLS = [
  {
    url: 'https://httpbin.org/ip',
    parseIp: (data) => data.origin,
  },
  {
    url: 'https://ifconfig.me/ip',
    parseIp: (data) => String(data).trim(),
  },
];

async function getClientIp() {
  const errors = [];

  for (const api of IP_API_URLS) {
    try {
      const { data } = await axios.get(api.url, {
        timeout: 10_000,
      });

      return api.parseIp(data);
    } catch (error) {
      errors.push(`${api.url}: ${error.message || error.code || String(error)}`);
    }
  }

  throw new Error(errors.join('\n'));
}

try {
  const ip = await getClientIp();
  console.log(`客户端出口 IP: ${ip}`);
} catch (error) {
  const reason = error.response
    ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`
    : error.message || error.code || String(error);

  console.error('获取客户端 IP 失败:', reason);
  process.exitCode = 1;
}
