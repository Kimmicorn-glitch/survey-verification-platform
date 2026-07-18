const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.backofficepro.com"

interface WebVitalsMetric {
  id: string
  name: string
  value: number
  delta: number
  rating: "good" | "needs-improvement" | "poor"
}

interface PerformanceEntry {
  name: string
  duration: number
  startTime: number
  entryType: string
}

interface CustomMetric {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp: number
}

const METRICS_ENDPOINT = `${API_BASE_URL}/metrics`

let reported = false

function getRating(name: string, value: number): "good" | "needs-improvement" | "poor" {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    TTFB: [800, 1800],
    FCP: [1800, 3000],
    INP: [200, 500],
  }

  const [good, poor] = thresholds[name] || [0, 0]
  if (value <= good) return "good"
  if (value <= poor) return "needs-improvement"
  return "poor"
}

async function sendMetric(metric: WebVitalsMetric | CustomMetric) {
  if (typeof window === "undefined") return

  try {
    await fetch(METRICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metric),
      keepalive: true,
    })
  } catch {
    // silently fail — metrics should never block the app
  }
}

export function reportWebVitals(onMetric?: (metric: WebVitalsMetric) => void) {
  if (reported || typeof window === "undefined") return
  reported = true

  try {
    // @ts-expect-error web-vitals may not be installed as dependency
    import("web-vitals").then(({ onLCP, onFID, onCLS, onTTFB, onFCP, onINP }) => {
      const handler = (metric: WebVitalsMetric) => {
        metric.rating = getRating(metric.name, metric.value)
        onMetric?.(metric)
        sendMetric(metric)
      }

      onLCP(handler)
      onFID(handler)
      onCLS(handler)
      onTTFB(handler)
      onFCP(handler)
      onINP(handler)
    })
  } catch {
    // web-vitals not available — degrade gracefully
  }
}

export function trackCustomMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
) {
  const metric: CustomMetric = {
    name,
    value,
    tags,
    timestamp: Date.now(),
  }
  sendMetric(metric)
}

export function trackTiming<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  trackCustomMetric(`timing.${name}`, duration)
  return result
}

export async function trackAsyncTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    trackCustomMetric(`timing.${name}`, duration)
    return result
  } catch (err) {
    const duration = performance.now() - start
    trackCustomMetric(`timing.${name}.error`, duration, {
      error: err instanceof Error ? err.message : "unknown",
    })
    throw err
  }
}

export function measurePaint(name?: string) {
  if (typeof window === "undefined") return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const paintEntry = entry as PerformanceEntry
      trackCustomMetric(`paint.${name || paintEntry.name}`, paintEntry.startTime)
    }
  })

  try {
    observer.observe({ type: "paint", buffered: true })
  } catch {
    // paint observation not supported
  }
}

export function measureResource(name?: string) {
  if (typeof window === "undefined") return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const resource = entry as PerformanceEntry & { transferSize?: number }
      trackCustomMetric(`resource.${name || resource.name}`, resource.duration, {
        type: resource.entryType,
        size: String(resource.transferSize ?? 0),
      })
    }
  })

  try {
    observer.observe({ type: "resource", buffered: true })
  } catch {
    // resource observation not supported
  }
}
