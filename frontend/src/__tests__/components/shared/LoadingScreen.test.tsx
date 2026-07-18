import React from "react"
import { render, screen } from "@testing-library/react"
import { LoadingScreen } from "@/components/shared/LoadingScreen"

jest.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, Record<string, unknown>>(
      ({ children, ...props }, ref) => {
        const filteredProps: Record<string, unknown> = {}
        Object.entries(props).forEach(([key, value]) => {
          if (!["initial", "animate", "transition", "whileHover", "whileTap", "exit"].includes(key)) {
            filteredProps[key] = value
          }
        })
        return <div ref={ref} {...filteredProps}>{children}</div>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock("lucide-react", () => ({
  Shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="shield-icon" {...props} />
  ),
}))

describe("LoadingScreen", () => {
  it("renders the platform name", () => {
    render(<LoadingScreen />)
    expect(screen.getByText("BackOffice")).toBeInTheDocument()
    expect(screen.getByText("Pro")).toBeInTheDocument()
  })

  it("renders the default subtitle message", () => {
    render(<LoadingScreen />)
    expect(screen.getByText("Survey Verification Platform")).toBeInTheDocument()
  })

  it("renders the shield icon (spinner)", () => {
    render(<LoadingScreen />)
    expect(screen.getByTestId("shield-icon")).toBeInTheDocument()
  })

  it("has correct container with full-screen layout", () => {
    const { container } = render(<LoadingScreen />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).toHaveClass("fixed", "inset-0")
  })

  it("renders loading animation dots", () => {
    const { container } = render(<LoadingScreen />)
    const dots = container.querySelectorAll(".bg-electric-blue")
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })
})
