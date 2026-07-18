import {
  cn,
  formatCurrency,
  formatDate,
  truncate,
  generateId,
  getTrustScoreColor,
  getTrustScoreLabel,
  truncateAddress,
  isValidEthereumAddress,
} from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar")
    expect(result).toBe("foo bar")
  })

  it("resolves Tailwind conflicts", () => {
    const result = cn("px-4 py-2", "px-8")
    expect(result).toBe("py-2 px-8")
  })

  it("handles conditional classes", () => {
    const isActive = true
    const result = cn("base", isActive && "active", !isActive && "inactive")
    expect(result).toBe("base active")
  })

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("")
  })
})

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain("1,234.56")
    expect(result).toContain("$")
  })

  it("formats with specified currency", () => {
    const result = formatCurrency(1000, "EUR")
    expect(result).toContain("1,000")
    expect(result).toContain("€")
  })

  it("formats zero", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0")
  })

  it("formats large numbers", () => {
    const result = formatCurrency(1000000)
    expect(result).toContain("1,000,000")
  })
})

describe("formatDate", () => {
  it("formats a Date object", () => {
    const date = new Date("2024-06-15T00:00:00Z")
    const result = formatDate(date)
    expect(result).toContain("June")
    expect(result).toContain("15")
    expect(result).toContain("2024")
  })

  it("formats a date string", () => {
    const result = formatDate("2024-01-01")
    expect(result).toContain("January")
    expect(result).toContain("1")
    expect(result).toContain("2024")
  })

  it("respects custom format options", () => {
    const date = new Date("2024-03-20T00:00:00Z")
    const result = formatDate(date, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    expect(result).toBe("03/20/2024")
  })
})

describe("truncate", () => {
  it("returns original string if shorter than limit", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  it("truncates long strings with ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello...")
  })

  it("returns exact string at boundary length", () => {
    expect(truncate("hello", 5)).toBe("hello")
  })

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("")
  })
})

describe("generateId", () => {
  it("returns a hex string of expected length", () => {
    const id = generateId(16)
    expect(id).toHaveLength(32)
    expect(id).toMatch(/^[0-9a-f]+$/)
  })

  it("returns unique values on consecutive calls", () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it("respects custom length", () => {
    const id = generateId(8)
    expect(id).toHaveLength(16)
  })
})

describe("getTrustScoreColor", () => {
  it("returns green for high scores", () => {
    expect(getTrustScoreColor(90)).toBe("text-green-500")
    expect(getTrustScoreColor(80)).toBe("text-green-500")
  })

  it("returns yellow for good scores", () => {
    expect(getTrustScoreColor(70)).toBe("text-yellow-500")
    expect(getTrustScoreColor(60)).toBe("text-yellow-500")
  })

  it("returns orange for fair scores", () => {
    expect(getTrustScoreColor(50)).toBe("text-orange-500")
    expect(getTrustScoreColor(40)).toBe("text-orange-500")
  })

  it("returns red for poor scores", () => {
    expect(getTrustScoreColor(30)).toBe("text-red-500")
    expect(getTrustScoreColor(0)).toBe("text-red-500")
  })
})

describe("getTrustScoreLabel", () => {
  it("returns Excellent for high scores", () => {
    expect(getTrustScoreLabel(95)).toBe("Excellent")
    expect(getTrustScoreLabel(80)).toBe("Excellent")
  })

  it("returns Good for good scores", () => {
    expect(getTrustScoreLabel(70)).toBe("Good")
    expect(getTrustScoreLabel(60)).toBe("Good")
  })

  it("returns Fair for fair scores", () => {
    expect(getTrustScoreLabel(50)).toBe("Fair")
    expect(getTrustScoreLabel(40)).toBe("Fair")
  })

  it("returns Poor for low scores", () => {
    expect(getTrustScoreLabel(20)).toBe("Poor")
    expect(getTrustScoreLabel(0)).toBe("Poor")
  })
})

describe("truncateAddress", () => {
  const address = "0x1234567890abcdef1234567890abcdef12345678"

  it("truncates with default chars", () => {
    const result = truncateAddress(address)
    expect(result).toBe("0x1234...5678")
  })

  it("truncates with custom chars", () => {
    const result = truncateAddress(address, 6)
    expect(result).toBe("0x123456...345678")
  })

  it("returns empty string for empty address", () => {
    expect(truncateAddress("")).toBe("")
  })
})

describe("isValidEthereumAddress", () => {
  it("validates correct addresses", () => {
    expect(isValidEthereumAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(true)
  })

  it("rejects addresses without 0x prefix", () => {
    expect(isValidEthereumAddress("1234567890abcdef1234567890abcdef12345678")).toBe(false)
  })

  it("rejects short addresses", () => {
    expect(isValidEthereumAddress("0x1234")).toBe(false)
  })

  it("rejects addresses with invalid characters", () => {
    expect(isValidEthereumAddress("0xGGGG567890abcdef1234567890abcdef12345678")).toBe(false)
  })
})
