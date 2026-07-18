import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("api_errors");
const apiDuration = new Trend("api_duration", true);

const BASE_URL = __ENV.BASE_URL || "https://surveyplatform.backofficepro.com";
const API_TOKEN = __ENV.API_TOKEN || "";

function authHeaders() {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
    },
  };
}

export const options = {
  executor: "ramping-vus",
  startVUs: 1,
  stages: [
    { duration: "30s", target: 10 },
    { duration: "2m", target: 50 },
    { duration: "1m", target: 80 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<300", "p(99)<1000"],
    http_req_failed: ["rate<0.005"],
  },
};

const surveyIds = [];
let createdSurveyId = null;

export default function () {
  const rand = Math.random();

  if (rand < 0.15) {
    group("Create Survey", () => {
      const payload = JSON.stringify({
        title: `Load Test Survey ${Date.now()}`,
        description: "Created during load testing",
        anonymous: false,
      });
      const res = http.post(`${BASE_URL}/api/v1/surveys`, payload, authHeaders());
      check(res, {
        "create survey status 201 or 200": (r) => r.status === 201 || r.status === 200,
        "create survey < 500ms": (r) => r.timings.duration < 500,
      });
      if (res.status === 201 || res.status === 200) {
        try {
          const body = JSON.parse(res.body);
          if (body.data?.id) surveyIds.push(body.data.id);
        } catch {}
      }
      errorRate.add(res.status >= 400);
      apiDuration.add(res.timings.duration);
    });
  } else if (rand < 0.4) {
    group("List Surveys", () => {
      const res = http.get(`${BASE_URL}/api/v1/surveys?page=0&pageSize=20`, authHeaders());
      check(res, {
        "list surveys status 200": (r) => r.status === 200,
        "list surveys < 300ms": (r) => r.timings.duration < 300,
      });
      errorRate.add(res.status >= 400);
      apiDuration.add(res.timings.duration);
    });
  } else if (rand < 0.55) {
    group("Get Survey Detail", () => {
      const id = surveyIds.length > 0
        ? surveyIds[Math.floor(Math.random() * surveyIds.length)]
        : "00000000-0000-0000-0000-000000000000";
      const res = http.get(`${BASE_URL}/api/v1/surveys/${id}`, authHeaders());
      check(res, {
        "get survey responds": (r) => r.status === 200 || r.status === 404,
        "get survey < 200ms": (r) => r.timings.duration < 200,
      });
      errorRate.add(res.status >= 500);
      apiDuration.add(res.timings.duration);
    });
  } else if (rand < 0.7) {
    group("List Verifications", () => {
      const res = http.get(`${BASE_URL}/api/v1/verifications?page=0&pageSize=10`, authHeaders());
      check(res, {
        "list verifications responds": (r) => r.status === 200 || r.status === 401,
      });
      errorRate.add(res.status >= 500);
      apiDuration.add(res.timings.duration);
    });
  } else if (rand < 0.85) {
    group("Dashboard Stats", () => {
      const res = http.get(`${BASE_URL}/api/v1/dashboard/stats`, authHeaders());
      check(res, {
        "dashboard stats responds": (r) => r.status === 200 || r.status === 401,
        "dashboard stats < 200ms": (r) => r.timings.duration < 200,
      });
      errorRate.add(res.status >= 500);
      apiDuration.add(res.timings.duration);
    });
  } else {
    group("Notifications", () => {
      const res = http.get(`${BASE_URL}/api/v1/notifications?pageSize=5`, authHeaders());
      check(res, {
        "notifications responds": (r) => r.status === 200 || r.status === 401,
      });
      errorRate.add(res.status >= 500);
      apiDuration.add(res.timings.duration);
    });
  }

  sleep(Math.random() * 2 + 0.5);
}
