import { api, rateLimit } from "./api";
import { publicResponse } from "./public";
import { ApiError } from "./validation";

const allowedRequestHeaders: Record<string, true> = {
  "content-type": true,
  authorization: true,
  "x-amc-expected-account": true,
};

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8090);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be an integer between 1 and 65535.");
const loopback = ["localhost", "127.0.0.1", "::1"].includes(host);
const hostForUrl = host.includes(":") ? `[${host}]` : host;
const configuredBase = new URL(
  process.env.PUBLIC_BASE_URL || `http://${hostForUrl}:${port}`,
);
if (
  !["http:", "https:"].includes(configuredBase.protocol) ||
  configuredBase.username ||
  configuredBase.password ||
  configuredBase.pathname !== "/" ||
  configuredBase.search ||
  configuredBase.hash
)
  throw new Error(
    "PUBLIC_BASE_URL must be an HTTP(S) origin without a path or credentials.",
  );
if (!loopback && configuredBase.protocol !== "https:")
  throw new Error(
    "Non-loopback hosting requires an HTTPS PUBLIC_BASE_URL and TLS reverse proxy.",
  );
const base = configuredBase.origin;
const secureCookie = configuredBase.protocol === "https:";
const allowedOrigins = new Set<string>([base]);
if (loopback) {
  for (const origin of [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ])
    allowedOrigins.add(origin);
}
for (const configured of (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)) {
  const origin = new URL(configured);
  if (
    origin.origin !== configured ||
    origin.username ||
    origin.password ||
    !["http:", "https:"].includes(origin.protocol)
  )
    throw new Error(
      "ALLOWED_ORIGINS must contain exact comma-separated HTTP(S) origins.",
    );
  if (!loopback && origin.protocol !== "https:")
    throw new Error("Non-loopback browser origins must use HTTPS.");
  allowedOrigins.add(origin.origin);
}
const allowedHosts = new Set([configuredBase.host, `${hostForUrl}:${port}`]);
if (loopback) {
  allowedHosts.add(`localhost:${port}`);
  allowedHosts.add(`127.0.0.1:${port}`);
}

const server = Bun.serve({
  hostname: host,
  port,
  maxRequestBodySize: 512 * 1024,
  idleTimeout: 15,
  async fetch(request, server) {
    let response: Response;
    const origin = request.headers.get("origin");
    let isApi = false;
    try {
      if (request.url.length > 4096)
        throw new ApiError(414, "Request URL is too long.");
      const url = new URL(request.url);
      if (!allowedHosts.has(url.host))
        throw new ApiError(403, "Request host is not allowed.");
      isApi = url.pathname === "/api" || url.pathname.startsWith("/api/");
      const ip = server.requestIP(request)?.address || "local";
      rateLimit(`request:${ip}`, 600, 60000);
      if (origin && !allowedOrigins.has(origin))
        throw new ApiError(403, "This browser origin is not allowed.");
      if (isApi && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        // Native clients use bearer authorization without browser cookies. Cookie writes require Origin.
        if (
          !origin &&
          (request.headers.has("cookie") ||
            request.headers.get("sec-fetch-site") === "cross-site")
        )
          throw new ApiError(
            403,
            "Browser writes require an allowed Origin header.",
          );
      }
      if (request.method === "OPTIONS" && isApi) {
        if (!origin)
          throw new ApiError(
            403,
            "Preflight requires an allowed Origin header.",
          );
        const desiredMethod = request.headers.get(
          "access-control-request-method",
        );
        if (
          !desiredMethod ||
          !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(desiredMethod)
        )
          throw new ApiError(405, "Requested method is not allowed.");
        const desiredHeaders = (
          request.headers.get("access-control-request-headers") || ""
        )
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        if (desiredHeaders.some((value) => !allowedRequestHeaders[value]))
          throw new ApiError(403, "Requested headers are not allowed.");
        response = new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, X-AMC-Expected-Account",
            "Access-Control-Max-Age": "600",
          },
        });
      } else {
        response = isApi
          ? await api(request, url.pathname.slice(4), ip, secureCookie)
          : await publicResponse(request, base);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        response = Response.json(
          { error: error.message },
          {
            status: error.status,
            headers:
              error.status === 429 || error.status === 503
                ? { "Retry-After": "60" }
                : {},
          },
        );
      } else {
        // Do not log request bodies, URLs, database values, passwords, tokens or private errors.
        console.error("A server request failed; private details withheld.");
        response = Response.json(
          {
            error:
              "The server could not complete this request. Please try again.",
          },
          { status: 500 },
        );
      }
    }
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("X-Frame-Options", "DENY");
    headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    headers.set("Vary", "Origin");
    if (configuredBase.protocol === "https:")
      headers.set("Strict-Transport-Security", "max-age=31536000");
    if (isApi) {
      headers.set("Cache-Control", "no-store");
      headers.set("X-Robots-Tag", "noindex, nofollow");
      headers.set("Access-Control-Expose-Headers", "X-AMC-Account");
      headers.set(
        "Content-Security-Policy",
        "default-src 'none'; frame-ancestors 'none'",
      );
    } else {
      headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
      );
    }
    if (origin && allowedOrigins.has(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Credentials", "true");
    }
    return new Response(request.method === "HEAD" ? null : response.body, {
      status: response.status,
      headers,
    });
  },
  error() {
    return Response.json(
      { error: "The request could not be processed." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  },
});

console.info(
  `AbroadMedClub directory server listening on ${host}:${server.port}`,
);
