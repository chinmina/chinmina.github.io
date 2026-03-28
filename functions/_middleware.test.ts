import { describe, expect, it, vi } from "vitest"
import { onRequest } from "./_middleware"

function createContext(
  url: string,
  options: { method?: string; headers?: Record<string, string> } = {},
) {
  const request = new Request(url, {
    method: options.method ?? "GET",
    headers: options.headers ?? {},
  })
  const next = vi.fn(() => Promise.resolve(new Response("original")))
  return { request, next }
}

describe("markdown content negotiation middleware", () => {
  it("redirects GET with Accept: text/markdown to {path}.md", async () => {
    const context = createContext("https://example.com/contributing", {
      headers: { Accept: "text/markdown" },
    })

    const response = await onRequest(context)

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/contributing.md")
    expect(context.next).not.toHaveBeenCalled()
  })

  it("redirects GET on root path to /index.md", async () => {
    const context = createContext("https://example.com/", {
      headers: { Accept: "text/markdown" },
    })

    const response = await onRequest(context)

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/index.md")
    expect(context.next).not.toHaveBeenCalled()
  })

  it("passes through when Accept does not include text/markdown", async () => {
    const context = createContext("https://example.com/contributing", {
      headers: { Accept: "text/html" },
    })

    const response = await onRequest(context)

    expect(context.next).toHaveBeenCalled()
    expect(response).toBe(await context.next.mock.results[0].value)
  })

  it("passes through for non-GET/HEAD methods", async () => {
    const context = createContext("https://example.com/contributing", {
      method: "POST",
      headers: { Accept: "text/markdown" },
    })

    await onRequest(context)

    expect(context.next).toHaveBeenCalled()
  })

  it("passes through when URL path has a file extension", async () => {
    const context = createContext("https://example.com/styles/main.css", {
      headers: { Accept: "text/markdown" },
    })

    await onRequest(context)

    expect(context.next).toHaveBeenCalled()
  })

  it("redirects HEAD with Accept: text/markdown", async () => {
    const context = createContext("https://example.com/contributing", {
      method: "HEAD",
      headers: { Accept: "text/markdown" },
    })

    const response = await onRequest(context)

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/contributing.md")
  })

  it("redirects when Accept contains text/markdown among other types", async () => {
    const context = createContext("https://example.com/contributing", {
      headers: { Accept: "text/markdown, text/html;q=0.9" },
    })

    const response = await onRequest(context)

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/contributing.md")
  })

  it("preserves query string in redirect URL", async () => {
    const context = createContext(
      "https://example.com/contributing?ref=footer",
      {
        headers: { Accept: "text/markdown" },
      },
    )

    const response = await onRequest(context)

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/contributing.md?ref=footer")
  })

  it("passes through when no Accept header is present", async () => {
    const context = createContext("https://example.com/contributing")

    await onRequest(context)

    expect(context.next).toHaveBeenCalled()
  })
})
