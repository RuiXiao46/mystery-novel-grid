"use client"

import { useState, useEffect, useRef } from "react"
import NextImage from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, AlertCircle, Search, RefreshCw, Upload } from "lucide-react"
import { MovieSearchResult } from "../types"
import { useI18n } from "@/lib/i18n/provider"

interface MovieSearchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelectMovie: (movie: MovieSearchResult) => void
  onUploadImage?: (file: File) => void
  cellId?: number | null
}

type SearchStatus = {
  state: 'idle' | 'searching' | 'success' | 'error' | 'no-results';
  message: string;
};

export function MovieSearchDialog({ isOpen, onOpenChange, onSelectMovie, onUploadImage }: MovieSearchDialogProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<MovieSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchStatus, setSearchStatus] = useState<SearchStatus>({ 
    state: 'idle', 
    message: String(t('search.idle_hint')) 
  })
  const [totalResults, setTotalResults] = useState<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSearchTermRef = useRef<string>("");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setSearchStatus({ state: searchResults.length > 0 ? 'success' : 'idle', message: searchResults.length > 0 ? '' : String(t('search.idle_hint')) });
    } else if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [isOpen, searchResults.length, t]);

  const handleClearSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setSearchTerm('');
    setSearchResults([]);
    setTotalResults(0);
    setSearchStatus({ state: 'idle', message: String(t('search.idle_hint')) });
    lastSearchTermRef.current = '';
  };

  const searchBooks = async (retry: boolean = false) => {
    const term = retry ? lastSearchTermRef.current : searchTerm.trim();
    if (!term) {
      setSearchStatus({ state: 'idle', message: String(t('search.idle_hint')) });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    abortControllerRef.current = new AbortController();
    const currentAbortController = abortControllerRef.current;

    setIsLoading(true);
    if (!retry) {
      setSearchResults([]);
      setTotalResults(0);
    }

    setSearchStatus({ state: 'searching', message: String(t('search.searching')) + '...' });
    lastSearchTermRef.current = term;

    const timeoutId = setTimeout(() => {
      if (isLoading && currentAbortController === abortControllerRef.current) {
        setSearchStatus({ 
          state: 'searching', 
          message: String(t('search.searching')) + '...' 
        });
      }
    }, 3000);

    try {
      const apiEndpoint = `/api/movie-search?q=${encodeURIComponent(term)}`;
      const response = await fetch(apiEndpoint, { signal: currentAbortController.signal });

      if (currentAbortController !== abortControllerRef.current) {
        return;
      }

      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response has no body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let books: MovieSearchResult[] = [];
      const receivedBooks = new Map<string | number, MovieSearchResult>();
      let done = false;
      let buffer = "";

      while (!done) {
        if (currentAbortController !== abortControllerRef.current) {
          return;
        }

        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const data = JSON.parse(line);

            switch (data.type) {
              case "init":
                if (data.total !== undefined) {
                  setTotalResults(data.total);
                  setSearchStatus({ 
                    state: 'searching', 
                    message: String(t('search.results_count', { count: data.total }))
                  });
                }
                break;
              case "movieStart":
              case "movieComplete":
                if (data.movie?.id !== undefined) {
                  receivedBooks.set(data.movie.id, data.movie);
                }
                books = Array.from(receivedBooks.values());
                setSearchResults([...books]);
                break;
              case "end":
                if (books.length > 0) {
                  setSearchStatus({ state: 'success', message: '' });
                } else {
                  setSearchStatus({ state: 'no-results', message: data.message || String(t('search.no_results')) });
                }
                break;
              case "error":
                setSearchStatus({ state: 'error', message: data.message || String(t('search.no_results')) });
                break;
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setSearchStatus({ state: 'error', message: String(t('search.no_results')) });
    } finally {
      clearTimeout(timeoutId);
      if (currentAbortController === abortControllerRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (onUploadImage) onUploadImage(file);
    e.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-h-[90vh] sm:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('search.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={String(t('search.placeholder'))}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchBooks();
              }}
            />
            <div className="flex gap-2">
              <Button onClick={() => searchBooks()} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {t('search.search')}
              </Button>
              <Button variant="outline" onClick={handleClearSearch}>
                {t('search.clear')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {t('search.upload_image')}
              </Button>
            </div>
          </div>

          {searchStatus.state === 'searching' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{searchStatus.message || t('search.searching')}</span>
            </div>
          )}

          {searchStatus.state === 'error' && (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <p>{searchStatus.message}</p>
                <Button variant="link" className="p-0 h-auto" onClick={() => searchBooks(true)}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t('search.retry')}
                </Button>
              </div>
            </div>
          )}

          {searchStatus.state === 'no-results' && (
            <div className="text-sm text-gray-600">
              <p>{searchStatus.message || t('search.no_results')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('search.try_keywords')}</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {searchResults.map((book) => (
                <button
                  key={book.id || book.name}
                  onClick={() => onSelectMovie(book)}
                  className="flex flex-col items-center gap-1 text-left hover:opacity-90"
                  title={`${book.name}`}
                >
                  <div className="relative w-full aspect-[3/4] rounded overflow-hidden bg-gray-100 border">
                    {book.image ? (
                      <NextImage
                        src={book.image}
                        alt={book.name}
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm truncate mt-1 sm:mt-2">{book.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
