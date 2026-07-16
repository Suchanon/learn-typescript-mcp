# ts-mcp — learn TypeScript MCP

Learning project for the [Model Context Protocol](https://modelcontextprotocol.io) TypeScript SDK, built on [Bun](https://bun.com) (created with `bun init` in bun v1.3.14).

To install dependencies:

```bash
bun install
```

To run the tax-assistant example server (stdio):

```bash
bun run index.ts
```

## MCP weather tutorial (`tutorial/weather/`)

Follows the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) "Build your first server" / "Build your first client" tutorials, using the real NWS weather API.

- [tutorial/weather/server.ts](tutorial/weather/server.ts) — server factory + tool definitions (`get-alerts`, `get-forecast`)
- [tutorial/weather/server-stdio.ts](tutorial/weather/server-stdio.ts) — stdio transport entry point
- [tutorial/weather/server-http.ts](tutorial/weather/server-http.ts) — Streamable HTTP transport entry point (`Bun.serve()` on port 3000)
- [tutorial/weather/client.ts](tutorial/weather/client.ts) — example client (spawns the stdio server itself)
- [tutorial/weather-server.ts](tutorial/weather-server.ts) — compatibility shim for clients still pointing at the old pre-restructure path (e.g. a saved MCP Inspector connection); safe to delete once nothing references it

Both tools declare `default` values in their input schemas for development convenience — Inspector pre-fills its form with them (`state: CA`, latitude/longitude: San Francisco), so you can hit "Run Tool" without typing. Callers that pass their own arguments override them; the defaults only apply when an argument is omitted.

### Run the stdio server

Each client that connects (Claude Code, Inspector, `client.ts`) spawns its **own private copy** of this process — it's not a shared server.

```bash
bun run weather:stdio
```

### Run the HTTP server

One shared process that clients connect to over the network. Kill this terminal and every connected client loses the connection immediately.

```bash
bun run weather:http
```

### Run the example client

```bash
bun run weather:client
```

### Inspect/test with MCP Inspector

```bash
bunx @modelcontextprotocol/inspector
```

Opens a browser UI (proxy on port 6277, UI on port 6274). In the sidebar, connect it either way:

- **stdio**: Transport Type `STDIO`, Command `bun`, Args `tutorial/weather/server-stdio.ts`
- **HTTP**: Transport Type `Streamable HTTP`, URL `http://localhost:3000/mcp` — requires `server-http.ts` to already be running

Inspector remembers your last-used connection in the browser and auto-reconnects with it on load/refresh — always check the sidebar's Transport Type/URL before assuming what it's actually connected to.

If you get `PORT IS IN USE` on 6274/6277, a previous Inspector instance didn't shut down cleanly (it can leave its proxy process orphaned even after reporting failure). Find and kill it before retrying:

```bash
lsof -nP -iTCP:6274,6277 -sTCP:LISTEN
kill <PID>
```

### Connect to Claude Code

[.mcp.json](.mcp.json) registers the `weather` server, currently pointed at the HTTP transport — start `server-http.ts` (`bun run weather:http`) yourself before opening a Claude Code session here, or `/mcp` will show it disconnected.
