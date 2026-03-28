interface Context {
  request: Request
  next: () => Promise<Response>
}

export async function onRequest(context: Context): Promise<Response> {
  const { request } = context
  const method = request.method
  if (method !== "GET" && method !== "HEAD") {
    return context.next()
  }

  const url = new URL(request.url)
  const lastSegment = url.pathname.split("/").pop() ?? ""
  if (lastSegment.includes(".")) {
    return context.next()
  }

  const accept = request.headers.get("Accept") ?? ""
  if (!accept.includes("text/markdown")) {
    return context.next()
  }

  const path = url.pathname === "/" ? "/index" : url.pathname
  return new Response(null, {
    status: 302,
    headers: { Location: `${path}.md${url.search}` },
  })
}
