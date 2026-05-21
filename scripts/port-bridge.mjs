import { createServer } from 'http';
import { request } from 'http';

const TARGET_PORT = 5000;
const BRIDGE_PORT = 19926;

const server = createServer((req, res) => {
  const proxy = request(
    {
      host: '127.0.0.1',
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${TARGET_PORT}` },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  req.pipe(proxy);
  proxy.on('error', () => { try { res.statusCode = 502; res.end(); } catch {} });
});

server.on('upgrade', (req, socket, head) => {
  const proxyReq = request({
    host: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    headers: req.headers,
    method: req.method,
  });
  proxyReq.on('upgrade', (proxyRes, proxySocket) => {
    const headers = Object.entries(proxyRes.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\r\n');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n${headers}\r\n\r\n`);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
    proxySocket.on('error', () => socket.destroy());
    socket.on('error', () => proxySocket.destroy());
  });
  proxyReq.on('error', () => socket.destroy());
  proxyReq.end();
});

server.listen(BRIDGE_PORT, '0.0.0.0', () => {
  console.log(`[bridge] ${BRIDGE_PORT} → ${TARGET_PORT}`);
});
