import React from "react"
import { render, screen } from "@testing-library/react"
import LoginPage from "@/app/auth/login/page"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}))

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    clearError: jest.fn(),
  }),
}))

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
  Mail: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="mail-icon" {...props} />
  ),
  Lock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="lock-icon" {...props} />
  ),
  Eye: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="eye-icon" {...props} />
  ),
  EyeOff: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="eye-off-icon" {...props} />
  ),
  Loader2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="loader-icon" {...props} />
  ),
}))

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button {...props}>{children}</button>
  ),
}))

jest.mock("@/components/ui/input", () => {
  const React = require("react")
  const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />
  )
  Input.displayName = "Input"
  return { Input }
})

describe("LoginPage", () => {
  it("renders the login form heading", () => {
    render(<LoginPage />)
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument()
  })

  it("renders the email input field", () => {
    render(<LoginPage />)
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("name@company.com")).toBeInTheDocument()
  })

  it("renders the password input field", () => {
    render(<LoginPage />)
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument()
  })

  it("renders the submit button", () => {
    render(<LoginPage />)
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument()
  })

  it("renders the register link", () => {
    render(<LoginPage />)
    const registerLink = screen.getByText("Create one")
    expect(registerLink).toBeInTheDocument()
    expect(registerLink.closest("a")).toHaveAttribute("href", "/auth/register")
  })

  it("renders the forgot password link", () => {
    render(<LoginPage />)
    const forgotLink = screen.getByText("Forgot password?")
    expect(forgotLink).toBeInTheDocument()
    expect(forgotLink.closest("a")).toHaveAttribute("href", "/auth/forgot-password")
  })

  it("shows email and lock icons", () => {
    render(<LoginPage />)
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument()
    expect(screen.getByTestId("lock-icon")).toBeInTheDocument()
  })

  it("renders social login buttons", () => {
    render(<LoginPage />)
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument()
  })
})
