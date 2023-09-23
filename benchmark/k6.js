import http from 'k6/http';
import { Counter } from 'k6/metrics';

const SuccessResponses = new Counter('custom_success_responses');
const ClientErrors = new Counter('custom_client_errors');
const RateLimitErrors = new Counter('custom_rate_limit_errors');
const ServerErrors = new Counter('custom_server_errors');
const TimeoutRequests = new Counter('custom_timeout_requests');

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
  const res = http.get('http://127.0.0.1:3001/', { timeout: '4s' });

  if (res.status === 200) {
    SuccessResponses.add(1);
  } else if (res.status === 429) {
    RateLimitErrors.add(1);
  } else if (res.status >= 400 && res.status < 500) {
    ClientErrors.add(1);
  } else if (res.status >= 500) {
    ServerErrors.add(1);
  } else if (res.timed_out) {
    TimeoutRequests.add(1);
  }
}
