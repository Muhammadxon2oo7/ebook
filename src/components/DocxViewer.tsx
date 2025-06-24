'use client';

import React, { useState, useEffect, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { renderAsync } from 'docx-preview';

interface DocxViewerProps {
  docxUrl: string;
}

interface TocItem {
  id: string;
  title: string;
  page: number;
  textContent: string;
}

const DocxViewer: React.FC<DocxViewerProps> = ({ docxUrl }) => {
  const [pages, setPages] = useState<JSX.Element[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [showToc, setShowToc] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [bookmarkedPage, setBookmarkedPage] = useState<number | null>(null);
  const [customFont, setCustomFont] = useState('serif');

  const flipBookRef = useRef<any>(null);

  useEffect(() => {
    let tempContainer: HTMLDivElement | null = null;

    const fetchAndRenderDocx = async () => {
      try {
        const response = await fetch(docxUrl);
        if (!response.ok) throw new Error('Faylni yuklab bo‘lmadi: ' + response.statusText);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        tempContainer = document.createElement('div');
        tempContainer.style.visibility = 'hidden';
        document.body.appendChild(tempContainer);

        await renderAsync(arrayBuffer, tempContainer, undefined, { experimental: true });


        const paragraphs = Array.from(tempContainer.querySelectorAll('p'));
        const toc: TocItem[] = [];
        const pageElements: JSX.Element[] = [];
        let contentBuffer: string[] = [];
        let charCount = 0;
        const charsPerPage = 2500;

        paragraphs.forEach((el, idx) => {
          const text = el.textContent || '';
          if (text.length > 0) {
            if (charCount + text.length > charsPerPage && contentBuffer.length > 0) {
              pageElements.push(createPage(contentBuffer, pageElements.length + 1));
              contentBuffer = [text];
              charCount = text.length;
            } else {
              contentBuffer.push(text);
              charCount += text.length;
            }

            if (/^\s*[A-ZА-Я]\w+/.test(text)) {
              toc.push({
                id: `toc-${idx}`,
                title: text.substring(0, 50),
                page: pageElements.length + 1,
                textContent: text,
              });
            }
          }
        });

        if (contentBuffer.length > 0) {
          pageElements.push(createPage(contentBuffer, pageElements.length + 1));
        }

        pageElements.unshift(
          <div key="cover" className="page flex items-center justify-center bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white text-4xl font-bold">
            Kitob Nomi
          </div>
        );

        setPages(pageElements);
        setTocItems(toc);

        const savedBookmark = localStorage.getItem('bookmarkedPage');
        if (savedBookmark) {
          setBookmarkedPage(parseInt(savedBookmark, 10));
        }
      } catch (error) {
        setPages([
          <div key="error" className="page flex items-center justify-center bg-red-100 text-red-600 p-6">
            Xatolik yuz berdi: {(error as Error).message}
          </div>
        ]);
      } finally {
        if (tempContainer && tempContainer.parentNode) {
          document.body.removeChild(tempContainer);
        }
      }
    };

    fetchAndRenderDocx();
  }, [docxUrl]);

  const createPage = (contentBuffer: string[], pageNumber: number) => (
    <div
      key={`page_${pageNumber}`}
      className={`page relative ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-[#fdf6e3] to-[#f5e9d4] text-gray-900'} shadow-inner border rounded-md overflow-hidden`}
      style={{ padding: '2rem 1.5rem', boxSizing: 'border-box', fontFamily: customFont }}
    >
      <div className="w-full h-full flex flex-col justify-between">
        <div className="w-full h-full overflow-hidden text-ellipsis">
          {contentBuffer.map((para, i) => (
            <p
              key={i}
              className={`mb-2 ${highlightedId && para.includes(highlightedId) ? 'bg-yellow-200' : ''}`}
            >
              {para}
            </p>
          ))}
        </div>
        <span className="absolute bottom-2 right-4 text-xs text-gray-500">{pageNumber}</span>
      </div>
    </div>
  );

  const handlePageFlip = (e: any) => setCurrentPage(e.data + 1);

  const goToPage = (page: number, idToHighlight?: string) => {
    if (flipBookRef.current && page >= 1 && page <= pages.length) {
      flipBookRef.current.pageFlip().flip(page - 1);
      setCurrentPage(page);
      if (idToHighlight) setHighlightedId(idToHighlight);
    }
  };

  const downloadDocx = () => {
    const link = document.createElement('a');
    link.href = docxUrl;
    link.download = 'kitob.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleBookmark = () => {
    localStorage.setItem('bookmarkedPage', currentPage.toString());
    setBookmarkedPage(currentPage);
  };

  return (
    <div className={`flex flex-col items-center ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'} min-h-screen p-4`}>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setShowToc(!showToc)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
          {showToc ? 'Mundarijani yashirish' : 'Mundarija'}
        </button>
        <button onClick={() => setZoom((z) => Math.min(z + 0.2, 2))} className="px-2 py-1 bg-blue-500 text-white rounded">+</button>
        <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))} className="px-2 py-1 bg-blue-500 text-white rounded">-</button>
        <button onClick={toggleFullscreen} className="px-2 py-1 bg-gray-700 text-white rounded">⛶</button>
        <button onClick={downloadDocx} className="px-2 py-1 bg-yellow-500 text-white rounded">⬇</button>
        <button onClick={() => setDarkMode(!darkMode)} className="px-2 py-1 bg-purple-500 text-white rounded">{darkMode ? 'Light' : 'Dark'}</button>
        <button onClick={toggleBookmark} className="px-2 py-1 bg-orange-500 text-white rounded">📑</button>
        <select
          onChange={(e) => setCustomFont(e.target.value)}
          value={customFont}
          className="px-2 py-1 rounded bg-white text-black"
        >
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans-serif</option>
          <option value="monospace">Monospace</option>
        </select>
        {bookmarkedPage && (
          <button onClick={() => goToPage(bookmarkedPage)} className="px-2 py-1 bg-red-500 text-white rounded">Saq. {bookmarkedPage}</button>
        )}
      </div>

      {showToc && (
        <div className="bg-white p-4 rounded-lg shadow max-h-80 overflow-y-auto mb-4 w-full max-w-md text-black">
          <h2 className="text-lg font-bold mb-2">Mundarija</h2>
          <ul className="list-disc pl-4 space-y-1">
            {tocItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => goToPage(item.page, item.textContent)}
                  className="text-blue-600 hover:underline text-left"
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

<HTMLFlipBook
  width={400 * zoom}
  height={600 * zoom}
  size="stretch"
  minWidth={300}
  maxWidth={600}
  minHeight={400}
  maxHeight={800}
  maxShadowOpacity={0.5}
  showCover={true}
  mobileScrollSupport={true}
  onFlip={handlePageFlip}
  ref={flipBookRef}
  className="book"
  startPage={0}
  drawShadow={true}
  flippingTime={1000}
  usePortrait={false}
  startZIndex={0}
  autoSize={true}
  clickEventForward={true}
  useMouseEvents={true}
  swipeDistance={30}
  showPageCorners={true}
  style={{}} // Qo‘shildi
  disableFlipByClick={false} // Qo‘shildi
>
  {pages}
</HTMLFlipBook>



      <div className=" flex gap-4 mt-[90px]">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Oldingi
        </button>
        <span className="text-gray-700">{currentPage} / {pages.length || 1}</span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= pages.length}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Keyingi
        </button>
      </div>
    </div>
  );
};

export default DocxViewer;