import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, getRandomSelectionWord } from './config.js';
import { generateHtmlReport } from './html-report.js';

const selectionLatency = new Trend('selection_duration', true);
const selectionSuccessRate = new Rate('selection_success_rate');
const selectionReqs = new Counter('selection_reqs_total');

export const options = {
  scenarios: {
    selection_ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 10 },  // Warmup (10 VUs)
        { duration: '20s', target: 30 },  // Moderate write load (30 VUs)
        { duration: '20s', target: 60 },  // Higher write concurrency (60 VUs)
        { duration: '15s', target: 100 }, // Peak write load (100 concurrent writers)
        { duration: '10s', target: 0 },   // Cooldown
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<100'],
    'http_req_failed': ['rate<0.02'],
    'selection_success_rate': ['rate>0.98'],
  },
};

export default function () {
  const word = getRandomSelectionWord();
  const url = `${BASE_URL}/selcetion`;
  const payload = JSON.stringify({ word });
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST_Selection' },
  };

  const res = http.post(url, payload, params);

  selectionLatency.add(res.timings.duration);
  selectionReqs.add(1);

  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
    'selection recorded message': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.msg === 'Secltion Recorded';
      } catch (e) {
        return false;
      }
    },
  });

  selectionSuccessRate.add(passed);

  sleep(0.05);
}

export function handleSummary(data: any) {
  return {
    'reports/selection-report.html': generateHtmlReport(data, 'Selection Recording Endpoint VU Metrics Report'),
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
                    SELECTION RECORDING VU LOAD TEST SUMMARY
================================================================================
  Total Selections Recorded: ${total}
  Throughput               : ${rate} req/sec
  Average Latency          : ${avg} ms
  Median (P50) Latency     : ${med} ms
  P90 Latency              : ${p90} ms
  P95 Latency              : ${p95} ms
  P99 Latency              : ${p99} ms
  Failure Rate             : ${fail}%
================================================================================
  Detailed HTML Report written to: reports/selection-report.html
================================================================================
  `;
}
