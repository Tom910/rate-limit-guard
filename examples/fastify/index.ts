import Fastify from 'fastify'
import { rateLimitFastify } from '../../src/adapters/fastify'

const fastify = Fastify({
  logger: false
})

fastify.register(rateLimitFastify);

const wait = (ms: number) => new Promise((resolve) => setTimeout(() => {
  const start = Date.now()
  while (Date.now() - start < 10) { }
  resolve(null);
}, ms));

fastify.get('/', async function handler(request, reply) {
  // 150ms async, 30ms sync waiting. Possible rps = less 33
  await wait(50);
  await wait(50);
  await wait(50);

  return { hello: 'world' }
})

async function main() {
  try {
    await fastify.listen({ port: 3001 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main();
