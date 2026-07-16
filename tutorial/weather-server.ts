// Compatibility shim: this file moved to weather/server-stdio.ts.
// Kept so clients with a saved connection to the old path (e.g. MCP
// Inspector's remembered stdio args) keep working. Safe to delete once
// every client points at tutorial/weather/server-stdio.ts.
import './weather/server-stdio';
