import type { IncomingMessage, ServerResponse } from "node:http";
import { createApi } from "../app/api/server/app";

// Publica a mesma API Express local como função Node no Vercel.
const app = createApi();

const handler = (request: IncomingMessage, response: ServerResponse) => {
  const currentUrl = new URL(request.url ?? "/", "http://vercel.internal");
  const forwardedPath = currentUrl.searchParams.get("path");
  if (forwardedPath) request.url = forwardedPath;
  else if (request.url?.startsWith("/api"))
    request.url = request.url.slice(4) || "/";
  return (
    app as unknown as (req: IncomingMessage, res: ServerResponse) => unknown
  )(request, response);
};

export default handler;
