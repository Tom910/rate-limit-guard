import express from 'express'
import { rateLimitExpress } from '../../src/adapters/express'

const app = express()

app.use(rateLimitExpress());

const wait = (ms: number) => new Promise((resolve) => setTimeout(() => {
  const start = Date.now()
  while (Date.now() - start < 25) { }
  resolve(null);
}, ms));

app.get('/', async function handler(req, res) {
  // 150ms async, 50ms sync waiting. Possible rps = less 20
  await wait(50);
  await wait(100);

  res.json({ hello: 'world' })
})

app.listen({ port: 3000 })
