import express from 'express'
import { rateLimitExpress } from '../../src/adapters/express'

const app = express()

app.use(rateLimitExpress());

const wait = (ms: number) => new Promise((resolve) => setTimeout(() => {
  const start = Date.now()
  while (Date.now() - start < 10) { }
  resolve(null);
}, ms));

app.get('/', async function handler(req, res) {
  // 150ms async, 30ms sync waiting. Possible rps = less 33
  await wait(50);
  await wait(50);
  await wait(50);

  res.json({ hello: 'world' })
})

app.listen({ port: 3001 })
