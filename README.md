# ts-mcp

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
# learn-typescript-mcp

## MCP weather tutorial (`tutorial/`)

Follows the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) "Build your first server" / "Build your first client" tutorials, using the real NWS weather API.

- `tutorial/weather-tools.ts` — shared tool definitions (`get-alerts`, `get-forecast`)
- `tutorial/weather-server.ts` — stdio transport server
- `tutorial/weather-server-http.ts` — Streamable HTTP transport server (`Bun.serve()` on port 3000)
- `tutorial/weather-client.ts` — example client (spawns the stdio server itself)

### Run the stdio server

Each client that connects (Claude Code, Inspector, `weather-client.ts`) spawns its **own private copy** of this process — it's not a shared server.

```bash
bun run tutorial/weather-server.ts
```

### Run the HTTP server

One shared process that clients connect to over the network. Kill this terminal and every connected client loses the connection immediately.

```bash
bun run tutorial/weather-server-http.ts
```

### Run the example client

```bash
bun run tutorial/weather-client.ts
```

### Inspect/test with MCP Inspector

```bash
bunx @modelcontextprotocol/inspector
```

Opens a browser UI (proxy on port 6277, UI on port 6274). In the sidebar, connect it either way:

- **stdio**: Transport Type `STDIO`, Command `bun`, Args `tutorial/weather-server.ts`
- **HTTP**: Transport Type `Streamable HTTP`, URL `http://localhost:3000/mcp` — requires `weather-server-http.ts` to already be running

Inspector remembers your last-used connection in the browser and auto-reconnects with it on load/refresh — always check the sidebar's Transport Type/URL before assuming what it's actually connected to.

If you get `PORT IS IN USE` on 6274/6277, a previous Inspector instance didn't shut down cleanly (it can leave its proxy process orphaned even after reporting failure). Find and kill it before retrying:

```bash
lsof -nP -iTCP:6274,6277 -sTCP:LISTEN
kill <PID>
```

### Connect to Claude Code

[.mcp.json](.mcp.json) registers the `weather` server, currently pointed at the HTTP transport — start `weather-server-http.ts` yourself before opening a Claude Code session here, or `/mcp` will show it disconnected.
