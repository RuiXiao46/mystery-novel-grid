import { NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

function isAllowedDoubanImage(url: string) {
  return /^https?:\/\/img\d\.doubanio\.com\//i.test(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl || !isAllowedDoubanImage(targetUrl)) {
    return new NextResponse("Invalid image url", { status: 400 });
  }

  try {
    const fetchOptions: any = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/*",
        "Referer": "https://book.douban.com/",
      },
    };

    if (PROXY_URL) {
      fetchOptions.dispatcher = new ProxyAgent(PROXY_URL);
    }

    const response = await undiciFetch(targetUrl, fetchOptions);
    if (!response.ok) {
      return new NextResponse(`Image fetch failed: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Douban image proxy error:", error);
    return new NextResponse("Image proxy failed", { status: 500 });
  }
}
