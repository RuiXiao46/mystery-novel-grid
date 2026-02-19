// app/api/movie-search/route.ts
import { NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { TTLCache } from "@/lib/server-cache";

const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedBook = {
  id: string | number;
  name: string;
  image: string | null;
};

const bookSearchCache = new TTLCache<CachedBook[]>(CACHE_TTL_MS, 500);

type DoubanSuggestItem = {
  id?: string;
  title?: string;
  pic?: string;
  img?: string;
  url?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "搜索词不能为空" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: "init", 
          message: "正在搜索书籍..." 
        }) + "\n"));

        const cacheKey = query.toLowerCase();
        const cachedBooks = bookSearchCache.get(cacheKey);
        if (cachedBooks) {
          emitBooks(controller, encoder, cachedBooks);
          return;
        }

        const fetchOptions: any = {
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://book.douban.com/",
          },
        };

        if (PROXY_URL) {
          fetchOptions.dispatcher = new ProxyAgent(PROXY_URL);
        }

        const url = `https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(query)}`;
        const response = await undiciFetch(url, fetchOptions);

        if (!response.ok) {
          throw new Error(`Douban 接口返回 ${response.status}`);
        }

        const data = await response.json() as DoubanSuggestItem[];
        const books: CachedBook[] = (data || []).slice(0, 10).map((item) => {
          const imagePath = item.pic || item.img || null;
          const proxiedImage = imagePath
            ? `/api/douban-image?url=${encodeURIComponent(imagePath)}`
            : null;
          return {
            id: item.id || item.url || item.title || Math.random().toString(36).slice(2),
            name: item.title || "未知书名",
            image: proxiedImage,
          } satisfies CachedBook;
        }).filter((b) => b.name);

        if (books.length === 0) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: "end",
            message: "没有找到任何书籍"
          }) + "\n"));
          controller.close();
          return;
        }

        emitBooks(controller, encoder, books);
        bookSearchCache.set(cacheKey, books);
      } catch (error) {
        console.error("豆瓣搜索失败", error);
        controller.enqueue(encoder.encode(JSON.stringify({
          type: "error",
          message: `搜索失败: ${(error as Error).message}`
        }) + "\n"));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function emitBooks(controller: ReadableStreamDefaultController, encoder: TextEncoder, books: CachedBook[]) {
  controller.enqueue(encoder.encode(JSON.stringify({
    type: "init",
    total: books.length
  }) + "\n"));

  for (const book of books) {
    controller.enqueue(encoder.encode(JSON.stringify({
      type: "movieStart",
      movie: { ...book, image: null }
    }) + "\n"));

    controller.enqueue(encoder.encode(JSON.stringify({
      type: "movieComplete",
      movie: book
    }) + "\n"));
  }

  controller.enqueue(encoder.encode(JSON.stringify({
    type: "end",
    message: "所有书籍数据已发送完成",
    successCount: books.length
  }) + "\n"));
}
