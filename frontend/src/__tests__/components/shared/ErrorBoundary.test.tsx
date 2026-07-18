import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

jest.mock("lucide-react", () => ({
  AlertTriangle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="alert-icon" {...props} />
  ),
  RefreshCw: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="refresh-icon" {...props} />
  ),
}))

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}))

function ThrowingComponent() {
  throw new Error("Test error")
}

function SafeComponent() {
  return <div data-testid="safe-child">Safe content</div>
}

describe("ErrorBoundary", () => {
  const consoleSpy = jest.spyOn(console, "error").mockImplementation()

  afterEach(() => {
    consoleSpy.mockClear()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    )
    expect(screen.getByTestId("safe-child")).toBeInTheDocument()
    expect(screen.getByText("Safe content")).toBeInTheDocument()
  })

  it("renders error UI when a child component throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(
      screen.getByText("An unexpected error occurred. Our team has been notified.")
    ).toBeInTheDocument()
  })

  it("displays the retry button", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText("Try Again")).toBeInTheDocument()
    expect(screen.getByTestId("refresh-icon")).toBeInTheDocument()
  })

  it("renders the go home button", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText("Go Home")).toBeInTheDocument()
  })

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument()
    expect(screen.getByText("Custom Error")).toBeInTheDocument()
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument()
  })

  it("calls onError callback when an error occurs", () => {
    const onError = jest.fn()
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Test error" }),
      expect.any(Object)
    )
  })
})
