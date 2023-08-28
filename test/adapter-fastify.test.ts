import fastify, { FastifyInstance } from 'fastify';
import { rateLimitFastify } from '../src/adapters/fastify';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('rateLimitFastify', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = fastify();
    server.register(rateLimitFastify, { isImportantRequest: (payload) => payload.req.url === '/priority' });
    server.get('/', async (req, reply) => {
      await wait(10);
      return { type: 'normal' }
    });
    server.get('/priority', async (req, reply) => {
      await wait(10);
      reply.send({ type: 'priority' })
    });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('should handle requests and call done', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ type: 'normal' });
  });

  it('should limit the requests when reaching the threshold', async () => {
    const promises = [];
    for (let i = 0; i < 120; i++) {
      promises.push(server.inject({ method: 'GET', url: '/' }));
    }

    const results: number[] = [];
    await Promise.all(promises).then((responses) => {
      responses.forEach((response) => {
        results.push(response.statusCode);
      });
    });

    const byStatuses = results.reduce<Record<string, number>>((acc, status) => {
      const label = status.toString();
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    expect(byStatuses['200']).toBe(110); // 100 queue + 10 active = 110 running requests
    expect(byStatuses['429']).toBe(10); // 10 requests was rejected
  });

  it('priority requests should be handled first', async () => {
    const results: string[] = []
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(server.inject({ method: 'GET', url: '/' }).then((response) => { results.push(response.json().type) }));
      promises.push(server.inject({ method: 'GET', url: '/priority' }).then((response) => { results.push(response.json().type) }));
    }

    await Promise.all(promises);

    const lastPriorityIndex = results.lastIndexOf('priority');
    expect(results.length).toBe(200);
    // need to run 100 priority requests first
    expect(lastPriorityIndex < 140).toBe(true);
  });
});
