import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, getRandomPrefix, getRandomSelectionWord } from './config.js';
import { generateHtmlReport } from './html-report.js';

const autocompleteLatency = new Trend('autocomplete_latency', true);
const selectionLatency = new Trend('selection_latency', true);
const autocompleteSuccessRate = new Rate('autocomplete_success');
const selectionSuccessRate = new Rate('selection_success');
const totalOps = new Counter('total_operations');

export const options = {
  scenarios: {
    mixed_traffic: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '15s', target: 20 },   // Warmup 20 VUs
        { duration: '25s', target: 50 },   // 50 VUs
        { duration: '25s', target: 150 },  // 150 VUs
        { duration: '25s', target: 300 },  // 300 VUs
        { duration: '20s', target: 500 },  // 500 VUs
        { duration: '10s', target: 0 },    // Rampdown
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.02'],
    'autocomplete_latency': ['p(95)<30'],
    'selection_latency': ['p(95)<150'],
  },
};

export default function () {
  const isAutocomplete = Math.random() < 0.90;

  if (isAutocomplete) {
    const prefix = getRandomPrefix();
    const url = `${BASE_URL}/autocomplete?q=${encodeURIComponent(prefix)}`;
    const res = http.get(url, { tags: { name: 'GET_Autocomplete' } });

    autocompleteLatency.add(res.timings.duration);
    totalOps.add(1);

    const passed = check(res, {
      'autocomplete status is 200': (r) => r.status === 200,
    });
    autocompleteSuccessRate.add(passed);
  } else {
    const word = getRandomSelectionWord();
    const url = `${BASE_URL}/selcetion`;
    const payload = JSON.stringify({ word });
    const params = {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'POST_Selection' },
    };

    const res = http.post(url, payload, params);

    selectionLatency.add(res.timings.duration);
    totalOps.add(1);

    const passed = check(res, {
      'selection status is 200': (r) => r.status === 200,
    });
    selectionSuccessRate.add(passed);
  }

  sleep(0.015);
}

export function handleSummary(data: any) {
  return {
    'reports/capacity-report.html': generateHtmlReport(data, 'Whole Application Mixed VU Capacity & Traffic Test Report'),
    stdout: textSummary(data),
  };
}

function textSummary(data: any): string {
  const m = data.metrics || {};
  const total = m.http_reqs ? m.http_reqs.values.count : 0;
  const rate = m.http_reqs && m.http_reqs.values ? m.http_reqs.values.rate.toFixed(1) : '0';
  
  const acDur = m.autocomplete_latency ? m.autocomplete_latency.values : {};
  const selDur = m.selection_latency ? m.selection_latency.values : {};
  const fail = m.http_req_failed && m.http_req_failed.values ? (m.http_req_failed.values.rate * 100).toFixed(2) : '0';

  return `
================================================================================
              WHOLE APPLICATION CAPACITY & TRAFFIC TEST SUMMARY
================================================================================
  Total Requests Handled : ${total}
  Overall Throughput     : ${rate} req/sec
  Global Failure Rate    : ${fail}%

  AUTOCOMPLETE METRICS (90% Traffic):
    - P50 Latency        : ${acDur.med ? acDur.med.toFixed(2) : '-'} ms
    - P95 Latency        : ${acDur['p(95)'] ? acDur['p(95)'].toFixed(2) : '-'} ms
    - P99 Latency        : ${acDur['p(99)'] ? acDur['p(99)'].toFixed(2) : '-'} ms
    - Max Latency        : ${acDur.max ? acDur.max.toFixed(2) : '-'} ms

  SELECTION RECORDING METRICS (10% Traffic):
    - P50 Latency        : ${selDur.med ? selDur.med.toFixed(2) : '-'} ms
    - P95 Latency        : ${selDur['p(95)'] ? selDur['p(95)'].toFixed(2) : '-'} ms
    - P99 Latency        : ${selDur['p(99)'] ? selDur['p(99)'].toFixed(2) : '-'} ms
    - Max Latency        : ${selDur.max ? selDur.max.toFixed(2) : '-'} ms
================================================================================
  Detailed HTML Report written to: reports/capacity-report.html
================================================================================
  `;
}
