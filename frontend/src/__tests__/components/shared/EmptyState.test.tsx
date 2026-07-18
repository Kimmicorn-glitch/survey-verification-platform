import React from "react"
import { render, screen } from "@testing-library/react"
import { EmptyState } from "@/components/shared/EmptyState"

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
  Inbox: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="inbox-icon" {...props} />
  ),
}))

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(
      <EmptyState
        title="No surveys found"
        description="Create your first survey to get started."
      />
    )
    expect(screen.getByText("No surveys found")).toBeInTheDocument()
    expect(
      screen.getByText("Create your first survey to get started.")
    ).toBeInTheDocument()
  })

  it("renders the action element when provided", () => {
    render(
      <EmptyState
        title="Empty"
        description="Nothing here yet."
        action={<button>Create Survey</button>}
      />
    )
    expect(screen.getByRole("button", { name: "Create Survey" })).toBeInTheDocument()
  })

  it("does not render an action element when not provided", () => {
    const { container } = render(
      <EmptyState title="Empty" description="Nothing here." />
    )
    const actionDiv = container.querySelector(".flex.flex-col.items-center > div:last-child")
    expect(actionDiv).toBeUndefined()
  })

  it("renders default Inbox icon when no custom icon is provided", () => {
    render(<EmptyState title="Empty" description="Nothing here." />)
    expect(screen.getByTestId("inbox-icon")).toBeInTheDocument()
  })

  it("renders a custom icon when provided", () => {
    render(
      <EmptyState
        icon={<span data-testid="custom-icon">Custom</span>}
        title="Empty"
        description="Nothing here."
      />
    )
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
    expect(screen.queryByTestId("inbox-icon")).not.toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <EmptyState
        title="Empty"
        description="Nothing here."
        className="custom-class"
      />
    )
    expect(container.firstElementChild).toHaveClass("custom-class")
  })
})
