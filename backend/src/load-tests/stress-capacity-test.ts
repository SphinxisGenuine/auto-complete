import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, getRandomPrefix } from './config.js';
import { generateHtmlReport } from './html-report.js';

export const options = {
  scenarios: {
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '10s', target: 50 },   // Warmup 50 VUs
        { duration: '15s', target: 150 },  // High traffic
        { duration: '20s', target: 300 },  // Heavy traffic
        { duration: '20s', target: 600 },  // Stress level 600 VUs
        { duration: '20s', target: 1000 }, // Breaking point test 1000 VUs
        { duration: '10s', target: 0 },    // Recovery
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.05'],
  },
};

export default function () {
  const prefix = getRandomPrefix();
  const url = `${BASE_URL}/autocomplete?q=${encodeURIComponent(prefix)}`;
  
  const res = http.get(url, {
    tags: { name: 'GET_Stress_Autocomplete' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}

export function handleSummary(data: any) {
  return {
    'reports/stress-report.html': generateHtmlReport(data, 'Stress & Breaking Point VU Capacity Report'),
    stdout: textSummary(data),
  };
}

function textSummary(data: any): string {
  const m = data.metrics || {};
  const total = m.http_reqs ? m.http_reqs.values.count : 0;
  const rate = m.http_reqs && m.http_reqs.values ? m.http_reqs.values.rate.toFixed(1) : '0';
  const dur = m.http_req_duration ? m.http_req_duration.values : {};
  const p95 = dur['p(95)'] ? dur['p(95)'].toFixed(2) : '-';
  const p99 = dur['p(99)'] ? dur['p(99)'].toFixed(2) : '-';
  const fail = m.http_req_failed && m.http_req_failed.values ? (m.http_req_failed.values.rate * 100).toFixed(2) : '0';

  return `
================================================================================
                    STRESS & CAPACITY BREAKING POINT SUMMARY
================================================================================
  Peak VU Tested         : 1000 Concurrent Virtual Users
  Total Requests Handled : ${total}
  Max Sustained RPS      : ${rate} req/sec
  P95 Latency            : ${p95} ms
  P99 Latency            : ${p99} ms
  Failure / Drop Rate    : ${fail}%
================================================================================
  Detailed HTML Report written to: reports/stress-report.html
================================================================================
  `;
}
