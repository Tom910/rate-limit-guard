# Rate limit guard

Rate limit guard is a library that helps to prevent overload of the Node.js server. This plugin can help to reduce the timing of the execution of requests. Usually, if you have more requests than your applications can handle it creates a big queue of requests, that consumes more memory and more CPU, a lot of requests will be executed in parallel. As a result, your server will be paralyzed. This library can help to prevent this problem by limiting the amount of executed requests and controlling the health of your server based on the event loop delay.

You can also find more information in [the article on rate limiting](https://amarchenko.dev/blog/2023-09-23-rate-limiting/)

## Key Benefits:

- *Uptime for DDOS attacks* - if you have a lot of requests and your server is overloaded, it will not be able to process requests and will be unavailable. This library will help you to avoid this problem.
- *Not a typical rate-limiter* - usually rate-limiters are used to limit the number of requests per user. This library has different purposes. Can help to prevent overload of the server
- *Efficient algorithm* - this library uses an efficient algorithm and can handle a lot of requests, more than 1000 RPS
- *Fast resilience after overload* - if your server was overloaded, this library will help to recover from overload very fast
- *Universal* - you can use this library for `express`, `fastify`, and any purposes. Because this library has the common core part and adapters for different frameworks

## How to Install

```bash
npm install --save rate-limit-guard
```

## How to Use

`rate-limit-guard` has several different ways to use it. You can use adapters for popular libraries or create your adapter by creating the `RateLimit` class.

### Express

Add middleware `rateLimitExpress` to your Express app:
```js
const express = require('express');
const { RateLimitExpress } = require('rate-limit-guard/adapters/express');

const app = express();

app.get('/healthz', (req, res) => { // Health check need to register before rateLimitExpress plugin. If you use K8S
  res.json{ status: 'ok' }
});

app.use(rateLimitExpress());  // Very important to register plugin before any other middleware
// app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
```

### Fastify

Add plugin `rateLimitFastify` to your Fastify app:
```js
const fastify = require('fastify');
const { rateLimitFastify } = require('rate-limit-guard/adapters/fastify');

const app = fastify();

fastify.get('/healthz', (request, reply) => { // Health check need to register before rateLimitFastify plugin. If you use K8S
  return { status: 'ok' }
});

fastify.register(rateLimitFastify); // Very important to register plugin before any other plugins
// fastify.register(require('fastify-cors'));

fastify.get('/', (request, reply) => {
  return { hello: 'world' }
})

try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
```

### Custom Adapter

You can create your adapter by creating the `RateLimit` class for any purpose. Rate-limit-guard doesn't look on http-frameworks and you can use it for any other purposes like limit amount of function executions.

For example, I want to generate HTML pages. If it is a new page I want to generate it with priority. Sometimes a service has a lot of requests and I need to limit the amount of requests
```js

const { RateLimit } = require('rate-limit-guard');

const rateLimit = new RateLimit({ 
  hasImportantQueue: true,
  handleDiscardedRequest: (payload) => {
    console.log('Discarded request', payload);
  },
  handleNextRequest: async (payload) => {
    const content = await generatePage(payload);

    await savePage(payload, content);

    rateLimit.finish();
  }
});

rateLimit.add({ page: 'https://example.com' }, true);
rateLimit.add({ page: 'https://second.com' }, false);
```


## Features


### Configuration

Here's the default configuration:

```
export const DEFAULT_OPTIONS = {
  activeLimit: 10, // Maximum number of active processes.
  queueLimit: 100, // Maximum number of requests in the queue.
  maxEventLoopDelay: 100, // Maximum allowable delay in the event loop
  errorResponseBuilder // Function that builds the response to send when the limit is exceeded.
  isImportantRequest: (payload) => boolean, // Function that determines whether the request is important.
};
```

### Important Requests

You can mark requests as important by passing a custom `isImportantRequest` function to the constructor. This is useful if you want to split requests into important and not important and increase the chance of executing important requests.

The function takes the following parameters:
```ts
isImportantRequest?: (payload: RequestLimiterRequest) => boolean;
```

for example fastify adapter:
```js
server.register(rateLimitFastify, { isImportantRequest: (payload) => payload.req.url === '/priority' })
```

for example express adapter:
```js
app.use(rateLimitExpress({ isImportantRequest: (payload) => payload.req.url === '/priority' }));
```

All requests with URL = `/priority` will be executed first.

### Skip outdated requests

By default `rate-limit-guard` adapters skip all outdated requests. For example, clients' close connection and request was outdated. As a result server will not execute outdated requests

### Error Response Builder

You can customize the response that is sent when the limit is exceeded by passing a custom `errorResponseBuilder` function to the constructor. The function takes the following parameters:

```ts
errorResponseBuilder?: (payload: RequestLimiterRequest) => any;
```
You need to provide different errorResponseBuilder for different adapters. Check the source code of adapters for more details.
