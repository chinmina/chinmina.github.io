import { describe, expect, it } from "vitest"
import config from "./astro.config.mjs"

describe("astro.config.mjs", () => {
  it("sets canonical base URL to docs.chinmina.dev", () => {
    expect(config.site).toBe("https://docs.chinmina.dev")
  })
})
