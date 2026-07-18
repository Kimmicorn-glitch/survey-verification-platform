import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate = new Rate("errors");
const requestDuration = new Trend("request_duration", true);
const requestCount = new Counter("requests");

const BASE_URL = __ENV.BASE_URL || "https://surveyplatform.backofficepro.com";
const API_TOKEN = __ENV.API_TOKEN || "";

export const options = {
  scenarios: {
    smoke: {
      executor: "constant-vus",
      vus: 5,
      duration: "1m",
      tags: { scenario: "smoke" },
    },
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 50 },
        { duration: "5m", target: 50 },
        { duration: "2m", target: 100 },
        { duration: "5m", target: 100 },
        { duration: "2m", target: 0 },
      ],
      tags: { scenario: "load" },
    },
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 50 },
        { duration: "1m", target: 200 },
        { duration: "3m", target: 200 },
        { duration: "1m", target: 0 },
      ],
      tags: { scenario: "stress" },
    },
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "30s", target: 500 },
        { duration: "10s", target: 10 },
      ],
      tags: { scenario: "spike" },
    },
    soak: {
      executor: "constant-vus",
      vus: 30,
      duration: "1h",
      tags: { scenario: "soak" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1500"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.05"],
  },
};

function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  if (API_TOKEN) {
    headers["Authorization"] = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

export default function () {
  group("Health Check", () => {
    const res = http.get(`${BASE_URL}/actuator/health`);
    check(res, {
      "health status is 200": (r) => r.status === 200,
      "health response time < 200ms": (r) => r.timings.duration < 200,
    });
    errorRate.add(res.status !== 200);
    requestDuration.add(res.timings.duration);
    requestCount.add(1);
  });

  group("Landing Page", () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      "landing page loads": (r) => r.status === 200,
      "landing page has content": (r) => r.body.includes("Survey Verification"),
      "landing page loads < 2s": (r) => r.timings.duration < 2000,
    });
    errorRate.add(res.status !== 200);
    requestDuration.add(res.timings.duration);
    requestCount.add(1);
  });

  group("Auth - Login Page", () => {
    const res = http.get(`${BASE_URL}/auth/login`);
    check(res, {
      "login page loads": (r) => r.status === 200,
      "login page loads < 1s": (r) => r.timings.duration < 1000,
    });
    errorRate.add(res.status !== 200);
    requestDuration.add(res.timings.duration);
    requestCount.add(1);
  });

  group("API - List Surveys", () => {
    const res = http.get(`${BASE_URL}/api/v1/surveys?page=0&pageSize=10`, {
      headers: getHeaders(),
    });
    check(res, {
      "surveys endpoint responds": (r) => r.status === 200 || r.status === 401,
      "surveys response time < 500ms": (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status >= 500);
    requestDuration.add(res.timings.duration);
    requestCount.add(1);
  });

  group("API - Dashboard Stats", () => {
    const res = http.get(`${BASE_URL}/api/v1/dashboard/stats`, {
      headers: getHeaders(),
    });
    check(res, {
      "dashboard stats responds": (r) => r.status === 200 || r.status === 401,
      "dashboard stats < 300ms": (r) => r.timings.duration < 300,
    });
    errorRate.add(res.status >= 500);
    requestDuration.add(res.timings.duration);
    requestCount.add(1);
  });

  group("API - Notifications", () => {
    const res = http.get(`${BASE_URL}/api/v1/notifications?pageSize=5`, {
      headers: getHeaders(),
    });
    check(res, {
      "notifications endpoint responds": (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(res.status >= 500);
    requestDuration.add(res.timings.duration);
    requestCount.add(1);
  });

  group("AI Engine - Health", () => {
    const res = http.get(`${BASE_URL}/ai/health`);
    check(res, {
      "ai engine health responds": (r) => r.status === 200,
      "ai engine health < 200ms": (r) => r.timings.duration < 200,
    });
    errorRate.add(res.status !== 200);
    requestDuration.add(res.timings.duration);
    requestCount.add(1);
  });

  group("Static Assets", () => {
    const res = http.get(`${BASE_URL}/_next/static/chunks/webpack.js`);
    if (res.status === 200) {
      check(res, {
        "static assets load < 500ms": (r) => r.timings.duration < 500,
      });
    }
    requestDuration.add(res.timings.duration);
    requestCount.add(1);
  });

  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    metrics: {
      http_reqs: data.metrics.http_reqs?.values?.count || 0,
      http_req_duration_p95: data.metrics.http_req_duration?.values?.["p(95)"] || 0,
      http_req_duration_p99: data.metrics.http_req_duration?.values?.["p(99)"] || 0,
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate || 0,
      errors_rate: data.metrics.errors?.values?.rate || 0,
    },
    scenarios: {},
  };

  for (const [name, scenario] of Object.entries(data.metrics.checks || {})) {
    summary.scenarios[name] = scenario?.values?.passes || 0;
  }

  return {
    stdout: JSON.stringify(summary, null, 2),
    "load-test-results.json": JSON.stringify(summary, null, 2),
  };
}
