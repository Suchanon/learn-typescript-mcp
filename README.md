# learn TypeScript MCP

Learning monorepo for the [Model Context Protocol](https://modelcontextprotocol.io) TypeScript SDK, built on [Bun](https://bun.com) workspaces. Each learning topic lives in its own app under [apps/](apps/) — new topics get a new `apps/<topic>` workspace.

| App | What it is |
| --- | --- |
| [apps/weather/](apps/weather/) | The MCP weather tutorial, restructured as a **NestJS** application (running on the Bun runtime) |
| [apps/tax-assistant/](apps/tax-assistant/) | A minimal plain-TypeScript stdio MCP server (VAT calculator) |

To install dependencies for all workspaces:

```bash
bun install
```

## Weather app (`apps/weather/`) — NestJS + MCP

Follows the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) "Build your first server" / "Build your first client" tutorials, using the real NWS weather API — hosted inside a NestJS app.

- [apps/weather/src/main.ts](apps/weather/src/main.ts) — Nest HTTP bootstrap (port 3000, `bodyParser: false`)
- [apps/weather/src/stdio.ts](apps/weather/src/stdio.ts) — stdio entry point (Nest application context, logger disabled so stdout stays protocol-only)
- [apps/weather/src/weather/weather.service.ts](apps/weather/src/weather/weather.service.ts) — NWS API calls (`getActiveAlertHeadlines`, `getForecastPeriods`)
- [apps/weather/src/weather/weather-mcp.service.ts](apps/weather/src/weather/weather-mcp.service.ts) — builds the `McpServer`, registers `get-alerts` / `get-forecast`, owns the shared HTTP transport
- [apps/weather/src/weather/mcp.controller.ts](apps/weather/src/weather/mcp.controller.ts) — routes every method on `/mcp` into the MCP transport
- [apps/weather/src/weather/express-web-bridge.ts](apps/weather/src/weather/express-web-bridge.ts) — converts Express req/res ↔ web-standard Request/Response (the SDK's v2 transport is web-standard only)
- [apps/weather/client.ts](apps/weather/client.ts) — example client (spawns the stdio server itself)
- [apps/weather/test/mcp-http.test.ts](apps/weather/test/mcp-http.test.ts) — `bun test` boots the Nest app on an ephemeral port and connects a real streamable-HTTP MCP client
- [tutorial/weather-server.ts](tutorial/weather-server.ts) — compatibility shim for clients still pointing at the old pre-monorepo path (e.g. a saved MCP Inspector connection); safe to delete once nothing references it

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

### Run the tests / typecheck

```bash
bun test          # from apps/weather/ (or the repo root)
bun run typecheck # from the repo root — tsc over both apps
```

## Tax assistant (`apps/tax-assistant/`)

Minimal stdio MCP server with a single `calculate-vat` tool (Thai VAT 7%):

```bash
bun run tax:stdio
```

## Inspect/test with MCP Inspector

```bash
bunx @modelcontextprotocol/inspector
```

Opens a browser UI (proxy on port 6277, UI on port 6274). In the sidebar, connect it either way:

- **stdio**: Transport Type `STDIO`, Command `bun`, Args `apps/weather/src/stdio.ts`
- **HTTP**: Transport Type `Streamable HTTP`, URL `http://localhost:3000/mcp` — requires the HTTP server (`bun run weather:http`) to already be running

Inspector remembers your last-used connection in the browser and auto-reconnects with it on load/refresh — always check the sidebar's Transport Type/URL before assuming what it's actually connected to.

If you get `PORT IS IN USE` on 6274/6277, a previous Inspector instance didn't shut down cleanly (it can leave its proxy process orphaned even after reporting failure). Find and kill it before retrying:

```bash
lsof -nP -iTCP:6274,6277 -sTCP:LISTEN
kill <PID>
```

## Connect to Claude Code

[.mcp.json](.mcp.json) registers the `weather` server, pointed at the HTTP transport — start the Nest server (`bun run weather:http`) yourself before opening a Claude Code session here, or `/mcp` will show it disconnected.

## NestJS-on-Bun notes

- No `nest-cli`/webpack build step — Bun runs the TypeScript entrypoints directly (`bun src/main.ts`).
- [tsconfig.json](tsconfig.json) enables `experimentalDecorators` + `emitDecoratorMetadata`; Bun's transpiler honors both, which is what makes Nest constructor injection work.
- Nest still uses its Express adapter internally; only the runtime and package manager are Bun.
