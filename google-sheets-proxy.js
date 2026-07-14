import { createServer } from 'node:http';
import { get } from 'node:https';

const PORT = Number(process.env.PORT || 3001);

const server = createServer((req, res) => {
  if (req.url.startsWith('/proxy')) {
    const rawTarget = req.url.replace(/^\/proxy\?url=/, '');
    const target = new URL(decodeURIComponent(rawTarget));
    const request = get(target, (response) => {
      res.writeHead(response.statusCode || 200, {
        'Content-Type': response.headers['content-type'] || 'text/csv; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      response.pipe(res);
    });
    request.on('error', (error) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Proxy listening on ${PORT}`);
});
