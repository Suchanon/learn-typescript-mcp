import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

/**
 * The MCP SDK's streamable-HTTP transport speaks web-standard Request/Response,
 * while Nest's Express adapter exposes Node-style req/res — these helpers bridge
 * the two. Requires the app to be created with `bodyParser: false` so the raw
 * body is still readable here.
 */
export async function toWebRequest(request: ExpressRequest): Promise<Request> {
  const url = `${request.protocol}://${request.headers.host ?? 'localhost'}${request.originalUrl}`;

  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(name, entry);
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }

  let body: Uint8Array | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(chunk as Buffer);
    }
    if (chunks.length > 0) {
      body = Buffer.concat(chunks);
    }
  }

  return new Request(url, { method: request.method, headers, body });
}

export async function writeWebResponse(
  webResponse: Response,
  response: ExpressResponse,
): Promise<void> {
  response.status(webResponse.status);
  webResponse.headers.forEach((value, name) => response.setHeader(name, value));

  if (!webResponse.body) {
    response.end();
    return;
  }

  // Write chunk-by-chunk so SSE responses flush as events arrive instead of buffering.
  for await (const chunk of webResponse.body) {
    response.write(chunk);
  }
  response.end();
}
