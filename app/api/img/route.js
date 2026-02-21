import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return new NextResponse("Missing url", { status: 400 });

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Bad url", { status: 400 });
  }

  // Basic allowlist (adjust if needed)
  const allowedHosts = ["pbs.twimg.com", "abs.twimg.com", "twimg.com"];
  const hostOk = allowedHosts.some(
    (h) => parsed.hostname === h || parsed.hostname.endsWith("." + h)
  );
  if (!hostOk) return new NextResponse("Host not allowed", { status: 403 });

  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok) return new NextResponse("Upstream fetch failed", { status: 502 });

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  const bytes = await upstream.arrayBuffer();

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}