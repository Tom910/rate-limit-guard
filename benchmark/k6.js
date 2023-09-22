import http from 'k6/http';

export const options = {
  stages: [
    { duration: '5s', target: 10 },
    { duration: '10s', target: 200 },
    { duration: '2m', target: 200 },
    { duration: '5s', target: 10 }
  ],
  userAgent: 'MyK6UserAgentString/1.0',
};

export default function () {
  http.get('http://127.0.0.1:3001/', { timeout: '4s' });
}
