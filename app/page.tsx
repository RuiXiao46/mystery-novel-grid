"use client";

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/provider';
import { MovieGrid } from './components/MovieGrid';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { FeedbackSidebarTrigger } from './components/FeedbackSidebarTrigger';
import { MovieCell } from './types';
import { loadCellsFromDB } from './utils/indexedDB';
import { AlertTriangle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { t, locale } = useI18n();
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      // Common in-app browser identifiers
      const isInApp = /micromessenger|weibo|douban|qq\/|playstation|alipay/.test(ua);
      setIsInAppBrowser(isInApp);
    }
  }, []);

  const handleCopyUrl = async () => {
    console.log('Copy button clicked');
    try {
      await navigator.clipboard.writeText('mysterygrid.top');
      console.log('Copied successfully');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: try using document.execCommand
      try {
        const textArea = document.createElement('textarea');
        textArea.value = 'mysterygrid.top';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };

  const [cells, setCells] = useState<MovieCell[]>(
    (t('cell_titles') as string[]).map((title, index) => ({
      id: index,
      title,
      image: undefined,
      name: undefined,
      imageObj: null,
    }))
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedCells = await loadCellsFromDB();
        setCells((prevCells) => {
          let newCells = [...prevCells];
          // Merge DB data but keep localized titles intact.
          savedCells.forEach((savedCell) => {
            const idx = newCells.findIndex((cell) => cell.id === savedCell.id);
            if (idx !== -1) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { title: _ignoredTitle, ...rest } = savedCell as MovieCell;
              newCells[idx] = { ...newCells[idx], ...rest } as MovieCell;
            }
          });

          // 搴旂敤璇ヨ绯讳笅鐨勮嚜瀹氫箟鏍囬瑕嗙洊
          if (typeof window !== 'undefined') {
            const key = `movieGridTitles_${locale}`;
            const json = localStorage.getItem(key);
            if (json) {
              try {
                const map: Record<string, string> = JSON.parse(json);
                newCells = newCells.map((c) => ({ ...c, title: map[c.id] ?? c.title }));
              } catch {}
            }
          }
          return newCells;
        });
      } catch (e) {
        console.error('鍔犺浇鏁版嵁澶辫触:', e);
      } finally {
        setLoading(false);
      }
    };

    // 娣诲姞瓒呮椂鏈哄埗锛岀‘淇濆嵆浣?IndexedDB 澶辫触涔熻兘鏄剧ず鐣岄潰锛堢壒鍒槸 Safari 绉诲姩绔級
    let timeoutTriggered = false;
    const timeoutId = setTimeout(() => {
      timeoutTriggered = true;
      console.warn('IndexedDB 鍔犺浇瓒呮椂锛屽凡寮哄埗鏄剧ず椤甸潰');
      setLoading(false);
    }, 800); // 800ms瓒呮椂

    loadData().finally(() => {
      if (!timeoutTriggered) {
        clearTimeout(timeoutId);
      }
    });

    return () => clearTimeout(timeoutId);
  }, [locale]);

  const handleUpdateCells = (newCells: MovieCell[]) => setCells(newCells);

  return (
    <main className="min-h-screen flex flex-col items-center py-8 relative">
      {isInAppBrowser && (
        <div className="w-full max-w-[1200px] px-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-full bg-yellow-50 rounded-md p-4 border-l-4 border-yellow-400 text-sm">
            <p className="font-bold flex items-center gap-2 text-yellow-700 mb-1">
              <AlertTriangle className="h-4 w-4" />
              {t('common.tip')}
            </p>
            <p className="text-black/90 leading-relaxed mb-3">
              {t('warning.in_app_browser')}
            </p>
            <div className="flex items-center gap-2 bg-white/60 rounded px-3 py-2 border border-yellow-200">
              <code className="flex-1 text-xs font-mono text-black/80">mysterygrid.top</code>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 hover:bg-yellow-100"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-yellow-700" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      <FeedbackSidebarTrigger />
      <LanguageSwitcher />

      {/* SEO 浼樺寲锛氳涔夊寲鏍囬 */}
      <h1 className="sr-only">
        {t('global.main_title')}
      </h1>

      {!loading && (
        <MovieGrid initialCells={cells} onUpdateCells={handleUpdateCells} />
      )}

      <div className="text-sm text-gray-500 mt-6 text-center px-4">
        <p className="flex items-center justify-center mb-1">
          {t('footer.if_useful_star')}
          <a
            href="https://github.com/RuiXiao46/mystery-novel-grid"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.shields.io/github/stars/RuiXiao46/mystery-novel-grid?style=social"
              alt="GitHub Stars"
              className="align-middle"
            />
          </a>
        </p>
        
        <p className="flex items-center justify-center mb-1">
          {t('footer.friendship_link')}<a className="text-blue-500 mr-1" href="https://gamegrid.shatranj.space/">{t('footer.friendship_link_site')}</a>
        </p>
        <p className="flex items-center justify-center mb-1">
          Powered by
          <a
            className="ml-1 text-gray-500 hover:underline focus-visible:underline"
            href="https://www.douban.com/"
          >
            Douban
          </a>
        </p>
        <p className="flex items-center justify-center mt-1">
          <a
            href="https://hits.sh/github.com/RuiXiao46/mystery-novel-grid"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://hits.sh/github.com/RuiXiao46/mystery-novel-grid.svg?label=views&color=007ec6"
              alt="Visitors Count"
              className="align-middle"
            />
          </a>
        </p>
      </div>

      {/* JSON-LD: WebApplication */}
      {(() => {
        const base = 'https://mysterygrid.top';
        const url = base;
        const webAppLd: Record<string, unknown> = {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name:
            (typeof t('global.main_title') === 'string' && t('global.main_title')) ||
            'Movie Preference Grid',
          url,
          applicationCategory: 'EntertainmentApplication',
          operatingSystem: 'Web',
          inLanguage: locale,
          description:
            (typeof t('meta.description') === 'string' && t('meta.description')) ||
            'Create your mystery novel preference grid',
        };
        const faqLd = null;
        return (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }}
            />
            {faqLd && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
              />
            )}
          </>
        );
      })()}
    </main>
  );
}




