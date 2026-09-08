import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, getRandomPrefix } from './config.js';
import { generateHtmlReport } from './html-report.js';

// Custom metrics to track latency percentiles and throughput specifically for autocomplete
const autocompleteLatency = new Trend('autocomplete_duration', true);
const autocompleteSuccessRate = new Rate('autocomplete_success_rate');
const autocompleteReqs = new Counter('autocomplete_reqs_total');

export const options = {
  scenarios: {
    autocomplete_ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 20 },  // Warmup to 20 VUs
        { duration: '20s', target: 50 },  // Moderate concurrency (50 VUs)
        { duration: '20s', target: 100 }, // High concurrency (100 VUs)
        { duration: '20s', target: 250 }, // Heavy concurrency (250 VUs)
        { duration: '15s', target: 500 }, // Peak concurrency (500 VUs)
        { duration: '10s', target: 0 },   // Graceful cooldown
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<25', 'p(99)<50'],
    'http_req_failed': ['rate<0.01'],
    'autocomplete_success_rate': ['rate>0.99'],
  },
};

export default function () {
  const prefix = getRandomPrefix();
  const url = `${BASE_URL}/autocomplete?q=${encodeURIComponent(prefix)}`;

  const res = http.get(url, {
    tags: { name: 'GET_Autocomplete' },
  });

  autocompleteLatency.add(res.timings.duration);
  autocompleteReqs.add(1);

  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
    'has result array': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.result);
      } catch (e) {
        return false;
      }
    },
    'response time < 50ms': (r) => r.timings.duration < 50,
  });

  autocompleteSuccessRate.add(passed);

  sleep(0.01);
}

export function handleSummary(data: any) {
  return {
    'reports/autocomplete-report.html': generateHtmlReport(data, 'Autocomplete Endpoint (Trie) VU Latency Report'),
    stdout: textSummary(data),
  };
}

function textSummary(data: any): string {
  const m = data.metrics || {};
  const total = m.http_reqs ? m.http_reqs.values.count : 0;
  const rate = m.http_reqs && m.http_reqs.values ? m.http_reqs.values.rate.toFixed(1) : '0';
  const dur = m.http_req_duration ? m.http_req_duration.values : {};
  const avg = dur.avg ? dur.avg.toFixed(2) : '-';
  const med = dur.med ? dur.med.toFixed(2) : '-';
  const p90 = dur['p(90)'] ? dur['p(90)'].toFixed(2) : '-';
  const p95 = dur['p(95)'] ? dur['p(95)'].toFixed(2) : '-';
  const p99 = dur['p(99)'] ? dur['p(99)'].toFixed(2) : '-';
  const fail = m.http_req_failed && m.http_req_failed.values ? (m.http_req_failed.values.rate * 100).toFixed(2) : '0';

  return `
================================================================================
                    AUTOCOMPLETE VU LOAD TEST SUMMARY
================================================================================
  Total Requests Handled : ${total}
  Average Throughput     : ${rate} req/sec
  Average Latency        : ${avg} ms
  Median (P50) Latency   : ${med} ms
  P90 Latency            : ${p90} ms
  P95 Latency            : ${p95} ms
  P99 Latency            : ${p99} ms
  Failure Rate           : ${fail}%
================================================================================
  Detailed HTML Report written to: reports/autocomplete-report.html
================================================================================
  `;
}
