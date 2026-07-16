// Compatibility shim: the weather server now lives in apps/weather (NestJS).
// Kept so clients with a saved connection to the old path (e.g. MCP
// Inspector's remembered stdio args) keep working. Safe to delete once
// every client points at apps/weather/src/stdio.ts.
import '../apps/weather/src/stdio';
