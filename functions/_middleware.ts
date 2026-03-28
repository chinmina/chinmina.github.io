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

  const accept = request.headers.get("Accept") ?? ""
  if (!accept.includes("text/markdown")) {
    return context.next()
  }

  const url = new URL(request.url)
  const pathname = cutSuffix(url.pathname, "/")
  const lastSegment = cutEnd(pathname, "/")
  if (lastSegment.includes(".")) {
    return context.next()
  }

  const path = pathname === "" ? "/index" : pathname
  return new Response(null, {
    status: 302,
    headers: { Location: `${path}.md${url.search}` },
  })
}

function cutSuffix(path: string, suffix: string): string {
  if (path.endsWith(suffix)) {
    return path.slice(0, -suffix.length)
  }
  return path
}

function cutEnd(str: string, sep: string): string {
  const index = str.lastIndexOf(sep)
  if (index === -1) {
    return str
  }
  return str.slice(index)
}
