import fastify, { FastifyInstance } from "fastify";
import { rateLimitFastify } from "../src/adapters/fastify";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const errorResponseBuilder = (payload: any) => {
  const error = new Error(`index ${payload.req.query.index}`);
  (error as any).statusCode = 429;
  return error;
};

describe("rateLimitFastify", () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = fastify();
    server.register(rateLimitFastify, {
      isImportantRequest: (payload) => payload.req.url === "/priority",
      errorResponseBuilder,
    });
    server.get("/", async (req, reply) => {
      await wait(10);
      const { index } = req.query as any;
      return { type: "normal", index: +index || 0 };
    });
    server.get("/priority", async (req, reply) => {
      await wait(10);
      reply.send({ type: "priority" });
    });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it("should handle requests and call done", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/",
      query: { index: "0" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ type: "normal", index: 0 });
  });

  it("should limit the requests when reaching the threshold", async () => {
    //@ts-ignore
    const promises = [];
    for (let i = 0; i < 120; i++) {
      promises.push(
        server.inject({ method: "GET", url: "/", query: { index: `${i}` } })
      );
    }

    const results: number[][] = [];
    await Promise.all(promises).then((responses) => {
      responses.forEach((response) => {
        results.push([response.statusCode, response.json().message]);
      });
    });

    const byStatuses = results.reduce<Record<string, number>>((acc, status) => {
      const label = status[0].toString();
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    expect(byStatuses["200"]).toBe(110); // 100 queue + 10 active = 110 running requests
    expect(byStatuses["429"]).toBe(10); // 10 requests was rejected
    // first 10 requests should be handled first next 10 requests should be rejected
    expect(results.filter((r) => r[0] === 429)).toMatchInlineSnapshot(`
      [
        [
          429,
          "index 10",
        ],
        [
          429,
          "index 11",
        ],
        [
          429,
          "index 12",
        ],
        [
          429,
          "index 13",
        ],
        [
          429,
          "index 14",
        ],
        [
          429,
          "index 15",
        ],
        [
          429,
          "index 16",
        ],
        [
          429,
          "index 17",
        ],
        [
          429,
          "index 18",
        ],
        [
          429,
          "index 19",
        ],
      ]
    `);
  });

  it("priority requests should be handled first", async () => {
    const results: string[] = [];
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        server.inject({ method: "GET", url: "/" }).then((response) => {
          results.push(response.json().type);
        })
      );
      promises.push(
        server.inject({ method: "GET", url: "/priority" }).then((response) => {
          results.push(response.json().type);
        })
      );
    }

    await Promise.all(promises);

    const lastPriorityIndex = results.lastIndexOf("priority");
    expect(results.length).toBe(200);
    // need to run 100 priority requests first
    expect(lastPriorityIndex < 140).toBe(true);
  });
});
