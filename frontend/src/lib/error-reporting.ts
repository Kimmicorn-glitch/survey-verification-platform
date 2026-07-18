const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.backofficepro.com"

interface ErrorReport {
  message: string
  stack?: string
  componentStack?: string
  url: string
  userId?: string
  userAgent: string
  timestamp: number
  severity: "low" | "medium" | "high" | "critical"
  tags?: Record<string, string>
}

interface ErrorReportingOptions {
  userId?: string
  baseUrl?: string
  maxReports?: number
  rateLimitMs?: number
}

const DEFAULT_OPTIONS: Required<ErrorReportingOptions> = {
  userId: "",
  baseUrl: API_BASE_URL,
  maxReports: 10,
  rateLimitMs: 60_000,
}

class ErrorReportingService {
  private options: Required<ErrorReportingOptions>
  private reportTimestamps: number[] = []

  constructor(options: ErrorReportingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  setUserId(userId: string | undefined) {
    this.options.userId = userId || ""
  }

  private isRateLimited(): boolean {
    const now = Date.now()
    this.reportTimestamps = this.reportTimestamps.filter(
      (t) => now - t < this.options.rateLimitMs
    )
    return this.reportTimestamps.length >= this.options.maxReports
  }

  async report(
    error: Error | string,
    severity: ErrorReport["severity"] = "medium",
    tags?: Record<string, string>
  ) {
    if (typeof window === "undefined") return
    if (this.isRateLimited()) return

    const errorObj =
      typeof error === "string" ? new Error(error) : error

    const report: ErrorReport = {
      message: errorObj.message,
      stack: errorObj.stack,
      url: window.location.href,
      userId: this.options.userId,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      severity,
      tags,
    }

    this.reportTimestamps.push(report.timestamp)

    try {
      await fetch(`${this.options.baseUrl}/errors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
        keepalive: true,
      })
    } catch {
      // error reporting must never block the application
    }
  }

  reportBoundaryError(error: Error, componentStack?: string) {
    this.report(error, "critical", componentStack ? { componentStack } : undefined)
  }

  reportApiError(endpoint: string, status: number, message: string) {
    this.report(message, status >= 500 ? "high" : "medium", {
      endpoint,
      status: String(status),
    })
  }

  reportClientError(message: string, tags?: Record<string, string>) {
    this.report(message, "medium", tags)
  }
}

export const errorReporter = new ErrorReportingService()

export function initErrorReporting(userId?: string) {
  if (userId) errorReporter.setUserId(userId)

  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      errorReporter.report(
        event.message || "Uncaught error",
        "high",
        { filename: event.filename, lineno: String(event.lineno) }
      )
    })

    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason
      const message =
        reason instanceof Error ? reason.message : String(reason)
      errorReporter.report(message, "high", { type: "unhandledrejection" })
    })
  }
}

export function reportError(
  error: Error | string,
  severity?: ErrorReport["severity"],
  tags?: Record<string, string>
) {
  return errorReporter.report(error, severity, tags)
}
