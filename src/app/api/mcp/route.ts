import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { allow } from "@/lib/limit";
import { createMcpServer } from "@/mcp/server";
import { bearerToken } from "@/mcp/token";
import { userForToken } from "@/mcp/tokens";

/**
 * TODOctopus as an MCP server (stateless Streamable HTTP). Clients send
 * `Authorization: Bearer tc_…`, a personal token made at /settings/tokens.
 */
async function handle(request: Request): Promise<Response> {
  const token = bearerToken(request.headers.get("authorization"));
  const owner = token ? await userForToken(token) : null;
  if (!owner) {
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32001, message: "Missing or invalid token" }, id: null },
      { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="todoctopus"' } },
    );
  }
  if (!(await allow(`mcp:${owner.userId}`, 120, 60_000))) {
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32002, message: "Too many requests" }, id: null },
      { status: 429, headers: { "Retry-After": "30" } },
    );
  }

  const server = createMcpServer(owner.userId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless: every request stands alone
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    void server.close();
  }
}

export const POST = handle;

/** No server-initiated stream and no sessions to end. */
const notAllowed = () =>
  new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
export const GET = notAllowed;
export const DELETE = notAllowed;
