import http from 'k6/http';

export const options = {
  stages: [
    { duration: '5s', target: 10 },
    { duration: '10s', target: 100 },
    { duration: '20s', target: 300 }
  ],
  noConnectionReuse: true,
  userAgent: 'MyK6UserAgentString/1.0',
};

export default function () {
  http.get('http://127.0.0.1:3000/', { timeout: '2s' });
}
