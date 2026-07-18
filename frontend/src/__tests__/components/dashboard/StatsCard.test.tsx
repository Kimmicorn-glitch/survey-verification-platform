import React from "react"
import { render, screen } from "@testing-library/react"
import { StatsCard } from "@/components/dashboard/StatsCard"

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
  ArrowUp: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="arrow-up" {...props} />
  ),
  ArrowDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="arrow-down" {...props} />
  ),
}))

const MockIcon = () => <svg data-testid="stat-icon" />

describe("StatsCard", () => {
  it("renders the title and value", () => {
    render(<StatsCard title="Total Surveys" value={42} icon={<MockIcon />} />)
    expect(screen.getByText("Total Surveys")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders string values correctly", () => {
    render(<StatsCard title="Trust Score" value="95%" icon={<MockIcon />} />)
    expect(screen.getByText("95%")).toBeInTheDocument()
  })

  it("renders the icon", () => {
    render(<StatsCard title="Surveys" value={10} icon={<MockIcon />} />)
    expect(screen.getByTestId("stat-icon")).toBeInTheDocument()
  })

  it("shows up arrow for positive change", () => {
    render(
      <StatsCard title="Responses" value={100} change={12} icon={<MockIcon />} />
    )
    expect(screen.getByTestId("arrow-up")).toBeInTheDocument()
    expect(screen.queryByTestId("arrow-down")).not.toBeInTheDocument()
    expect(screen.getByText("12%")).toBeInTheDocument()
  })

  it("shows down arrow for negative change", () => {
    render(
      <StatsCard title="Responses" value={100} change={-8} icon={<MockIcon />} />
    )
    expect(screen.getByTestId("arrow-down")).toBeInTheDocument()
    expect(screen.queryByTestId("arrow-up")).not.toBeInTheDocument()
    expect(screen.getByText("8%")).toBeInTheDocument()
  })

  it("shows default change label", () => {
    render(
      <StatsCard title="Surveys" value={5} change={10} icon={<MockIcon />} />
    )
    expect(screen.getByText("vs last month")).toBeInTheDocument()
  })

  it("shows custom change label", () => {
    render(
      <StatsCard
        title="Surveys"
        value={5}
        change={10}
        changeLabel="vs last week"
        icon={<MockIcon />}
      />
    )
    expect(screen.getByText("vs last week")).toBeInTheDocument()
  })

  it("does not render trend indicator when change is undefined", () => {
    render(<StatsCard title="Surveys" value={5} icon={<MockIcon />} />)
    expect(screen.queryByTestId("arrow-up")).not.toBeInTheDocument()
    expect(screen.queryByTestId("arrow-down")).not.toBeInTheDocument()
  })
})
