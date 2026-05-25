'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { LANGUAGES, LANG_EMOJI } from '@/lib/constants';
import { PdfPage, TranslatedPage } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import AuthModal from '@/components/auth/AuthModal';
import toast from 'react-hot-toast';

/* ─── Helpers ─────────────────────────────────────── */
function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.getContext('2d')!.drawImage(src, 0, 0);
  c.style.cssText = 'width:100%;height:auto;display:block;border-radius:10px;margin-bottom:10px;';
  return c;
}

export default function TranslatePage() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = getSupabaseClient();
  const [authOpen, setAuthOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  // File & PDF state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<PdfPage[]>([]);
  const translationCost = pdfPages.length > 0 ? Math.max(1, Math.ceil(pdfPages.length / 100)) : 0;
  const [translatedPages, setTranslatedPages] = useState<TranslatedPage[]>([]);
  const [bookContext, setBookContext] = useState('');

  // Language
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // Status
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [fileStatus, setFileStatus] = useState('');
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Reader
  const [readerOpen, setReaderOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{text:string;role:'user'|'ai'|'thinking'}[]>([
    { text: 'Salom! Kitob haqida savol bering yoki matn belgilab "Ask AI" tugmasini bosing.', role: 'ai' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Highlight
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightsVisible, setHighlightsVisible] = useState(true);
  const [hlToolbar, setHlToolbar] = useState<{x:number;y:number;visible:boolean}>({x:0,y:0,visible:false});
  const currentSelRef = useRef<Selection | null>(null);
  const selectedMarkRef = useRef<HTMLElement | null>(null);

  // Refs
  const originalViewerRef = useRef<HTMLDivElement>(null);
  const translatedViewerRef = useRef<HTMLDivElement>(null);
  const readerContentRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mwizStep = useRef(0);

  // Mobile wizard step
  const [mStep, setMStep] = useState(0);

  /* ─── Banner ─── */
  const closeBanner = () => {
    setBannerVisible(false);
  };

  /* ─── File loading ─── */
  const handleFileChange = useCallback(async (file: File) => {
    if (!user) { setAuthOpen(true); return; }
    if (!file.name.match(/\.(pdf|txt)$/i)) {
      toast.error('Faqat PDF yoki TXT qabul qilinadi'); return;
    }
    setSelectedFile(file);
    setError('');
    setFileStatus('⏳ Yuklanmoqda...');
    setPdfPages([]);
    setTranslatedPages([]);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        await loadPDF(file);
      } else {
        await loadTXT(file);
      }
    } catch (e) {
      toast.error('Fayl yuklashda xatolik');
      console.error(e);
    }
  }, [user]);

  const loadTXT = async (file: File) => {
    const text = await file.text();
    const sentences = text.match(/[^.!?]*[.!?]+/g) ?? [text];
    const chunks: string[] = [];
    let current = '';
    sentences.forEach(s => {
      if ((current + s).length > 2500) {
        if (current) chunks.push(current.trim());
        current = s;
      } else { current += s; }
    });
    if (current.trim()) chunks.push(current.trim());
    const pages: PdfPage[] = chunks.map((chunk, i) => ({ page: i + 1, text: chunk, canvas: null }));
    setPdfPages(pages);
    setFileStatus(`✅ ${pages.length} bo'lim yuklandi`);
    renderOriginal(pages);
  };

  const loadPDF = async (file: File) => {
    // @ts-expect-error: pdfjsLib loaded via CDN/global
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) { toast.error('PDF kutubxonasi yuklanmadi, sahifani yangilang'); return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: PdfPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      setFileStatus(`📄 Sahifa ${i}/${pdf.numPages} yuklanmoqda...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.3 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((it: {str:string}) => it.str)
        .filter((s: string) => s.trim())
        .filter((s: string) => !/^\s*\d{1,4}\s*$/.test(s))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      pages.push({ page: i, text, canvas });
    }

    if (pages.length === 0) { toast.error('PDF matn topilmadi'); return; }
    setPdfPages(pages);
    setFileStatus(`✅ ${pages.length} sahifa yuklandi`);
    renderOriginal(pages);
  };

  const renderOriginal = (pages: PdfPage[]) => {
    const viewer = originalViewerRef.current;
    if (!viewer) return;
    viewer.innerHTML = '';
    pages.forEach(p => {
      const div = document.createElement('div'); div.className = 'page';
      const num = document.createElement('div'); num.className = 'page-num';
      num.textContent = 'Sahifa ' + p.page; div.appendChild(num);
      if (p.canvas) div.appendChild(p.canvas);
      else {
        const t = document.createElement('div'); t.className = 'translation-text';
        t.textContent = p.text; div.appendChild(t);
      }
      viewer.appendChild(div);
    });
  };

  /* ─── Translation ─── */
  const startTranslation = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!selectedFile) { toast.error("Fayl yuklang"); return; }
    if (!selectedLanguage) { toast.error("Tilni tanlang"); return; }
    if (pdfPages.length === 0) { toast.error("Sahifalar topilmadi"); return; }
    if (!profile) { toast.error('Profil yuklanmoqda, sahifani yangilang.'); return; }

    const cost = translationCost;
    if (profile.wallet_balance < cost) {
      toast.error('Wallet balansingiz yetarli emas');
      return;
    }

    setIsTranslating(true);
    setProgress(0);
    setStatus('⚡ Tarjima boshlanmoqda...');
    setTranslatedPages([]);
    setBookContext('');

    const tv = translatedViewerRef.current!;
    tv.innerHTML = '<div class="live-badge"><div class="live-dot"></div>Tarjima qilinmoqda...</div>';

    try {
      const newPages: TranslatedPage[] = pdfPages.map(p => ({ page: p.page, text: '', canvas: p.canvas }));
      let ctx = '';

      const concurrency = 3;
      const failedPages: number[] = [];

      for (let i = 0; i < pdfPages.length; i += concurrency) {
        const batch = pdfPages.slice(i, i + concurrency).map((p, idx) => {
          const pageIndex = i + idx;
          return (async () => {
            if (p.text && p.text.trim().length > 0) {
              try {
                const res = await fetch('/api/translate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: p.text, targetLanguage: selectedLanguage }),
                });
                if (!res.ok) {
                  const errorData = await res.json().catch(() => null);
                  throw new Error(errorData?.error ?? `API xatolik: ${res.status}`);
                }
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                return { pageIndex, translated: data.translated ?? '' };
              } catch (error) {
                console.error('Tarjima sahifa xatosi:', pageIndex + 1, error);
                return { pageIndex, translated: '', error: error instanceof Error ? error.message : 'Tarjima xatosi' };
              }
            }
            return { pageIndex, translated: '' };
          })();
        });

        const settled = await Promise.allSettled(batch);
        const results = settled.map((result, idx) => {
          if (result.status === 'fulfilled') {
            return result.value as { pageIndex: number; translated: string; error?: string };
          }
          const pageIndex = i + idx;
          console.error('Tarjima batch xatosi:', pageIndex + 1, result.reason);
          return { pageIndex, translated: '', error: result.reason instanceof Error ? result.reason.message : String(result.reason) };
        });

        for (const r of results) {
          const pidx = r.pageIndex;
          const translated = r.translated ?? '';
          if (r.error) {
            failedPages.push(pidx + 1);
          }
          newPages[pidx] = { page: pdfPages[pidx].page, text: translated, canvas: pdfPages[pidx].canvas };
          if (translated) ctx += translated + '\n\n';
          appendTranslatedPage(newPages[pidx], tv);
          if (readerOpen && readerContentRef.current) appendToReader(newPages[pidx], readerContentRef.current);
        }

        const pct = Math.round(((Math.min(i + concurrency, pdfPages.length)) / pdfPages.length) * 100);
        setProgress(pct);
        setStatus(`⚡ ${Math.min(i + concurrency, pdfPages.length)}/${pdfPages.length} sahifa — ${pct}%`);
      }

      if (failedPages.length > 0) {
        const failedList = failedPages.slice(0, 10).join(', ');
        const extra = failedPages.length > 10 ? ` va ${failedPages.length - 10} ta boshqasi` : '';
        throw new Error(`Ba'zi sahifalarni tarjima qilib bo'lmadi: ${failedList}${extra}. Internet yoki OpenAI cheklovlari tekshiring.`);
      }

      setTranslatedPages(newPages);
      setBookContext(ctx);

      const baseTitle = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'Tarjima kitobi';
      const bookRecords = [
        {
          uploader_id: user.id,
          title: `${baseTitle} (Asl)`,
          original_language: null,
          translated_language: null,
          page_count: pdfPages.length,
          is_public: false,
          is_paid: false,
          price: 0,
          status: 'ready',
        },
        {
          uploader_id: user.id,
          title: `${baseTitle} (${selectedLanguage})`,
          original_language: null,
          translated_language: selectedLanguage,
          page_count: pdfPages.length,
          is_public: false,
          is_paid: false,
          price: 0,
          status: 'ready',
        },
      ];

      const { data: createdBooks, error: bookError } = await supabase
        .from('books')
        .insert(bookRecords)
        .select('id');

      if (bookError || !createdBooks || createdBooks.length !== 2) {
        console.error(bookError);
        throw new Error('Kitoblarni saqlashda xatolik yuz berdi');
      }

      const originalBookId = createdBooks[0].id as string;
      const translatedBookId = createdBooks[1].id as string;

      const originalChapters = pdfPages.map(p => ({
        book_id: originalBookId,
        chapter_number: p.page,
        title: `Sahifa ${p.page}`,
        content: p.text || 'Matn topilmadi.',
        audio_url: null,
        audio_generated: false,
      }));

      const translatedChapters = newPages.map(tp => ({
        book_id: translatedBookId,
        chapter_number: tp.page,
        title: `Sahifa ${tp.page}`,
        content: tp.text || 'Tarjima topilmadi.',
        audio_url: null,
        audio_generated: false,
      }));

      const { error: origChError } = await supabase.from('chapters').insert(originalChapters);
      if (origChError) {
        console.error(origChError);
        throw new Error('Asl kitob boblarini saqlashda xatolik yuz berdi');
      }

      const { error: transChError } = await supabase.from('chapters').insert(translatedChapters);
      if (transChError) {
        console.error(transChError);
        throw new Error('Tarjima kitob boblarini saqlashda xatolik yuz berdi');
      }

      const { error: chargeError } = await supabase.rpc('increment_wallet', {
        user_id: user.id,
        amount: -cost,
      });
      if (chargeError) throw chargeError;

      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'purchase',
        amount: -cost,
        description: `Tarjima uchun to'lov (${pdfPages.length} sahifa)`,
      });
      if (txError) throw txError;

      await refreshProfile();
      setStatus('✅ Tarjima muvaffaqiyatli yakunlandi!');
      toast.success(`Tarjima tayyor! Tarjima uchun ${cost} LC yechildi. Kitoblar Mening kitoblarimga qo‘shildi.`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Tarjima yoki saqlashda xatolik yuz berdi';
      setStatus('❌ Xatolik yuz berdi');
      toast.error(message);
    } finally {
      setIsTranslating(false);
    }
  };

  const appendTranslatedPage = (tp: TranslatedPage, container: HTMLElement) => {
    const existing = container.querySelector(`[data-page-id="${tp.page}"]`);
    if (existing) { existing.remove(); }
    const es = container.querySelector('.empty-state'); if (es) es.remove();
    const badge = container.querySelector('.live-badge');
    const div = document.createElement('div'); div.className = 'page'; div.dataset.pageId = String(tp.page);
    const num = document.createElement('div'); num.className = 'page-num'; num.textContent = 'Sahifa ' + tp.page; div.appendChild(num);
    if (tp.canvas) {
      div.appendChild(cloneCanvas(tp.canvas));
      if (tp.text) { const t = document.createElement('div'); t.className = 'translation-text'; t.style.marginTop = '8px'; t.textContent = tp.text; div.appendChild(t); }
    } else {
      if (tp.text) { const t = document.createElement('div'); t.className = 'translation-text'; t.textContent = tp.text; div.appendChild(t); }
      else {
        const t = document.createElement('div'); t.className = 'translation-text'; t.textContent = '🚫 Bu sahifa uchun tarjima matni topilmadi.'; div.appendChild(t);
      }
    }

    // Always append new translation pages to the bottom so live translation does not jump to the top.
    container.appendChild(div);
  };

  const appendToReader = (tp: TranslatedPage, rc: HTMLElement) => {
    if (rc.querySelector(`[data-page-id="${tp.page}"]`)) return;
    const div = document.createElement('div');
    div.className = 'page';
    div.dataset.pageId = String(tp.page);
    const num = document.createElement('div');
    num.className = 'page-num';
    num.textContent = 'Sahifa ' + tp.page;
    div.appendChild(num);
    if (tp.canvas) {
      div.appendChild(cloneCanvas(tp.canvas));
      if (tp.text) {
        const t = document.createElement('div'); t.className = 'translation-text'; t.textContent = tp.text; div.appendChild(t);
      }
    } else {
      if (tp.text) {
        const t = document.createElement('div'); t.className = 'translation-text'; t.textContent = tp.text; div.appendChild(t);
      } else {
        const t = document.createElement('div'); t.className = 'translation-text'; t.textContent = '🚫 Bu sahifa uchun tarjima matni topilmadi.'; div.appendChild(t);
      }
    }

    // Insert pages into the reader in numeric order to avoid jumping to the end
    const children = Array.from(rc.querySelectorAll('.page')) as HTMLElement[];
    let inserted = false;
    for (const child of children) {
      const cid = parseInt(child.dataset.pageId || '0', 10);
      if (cid > tp.page) { rc.insertBefore(div, child); inserted = true; break; }
    }
    if (!inserted) rc.appendChild(div);
  };

  /* ─── Reader ─── */
  const openReader = () => {
    setReaderOpen(true);
  };

  const closeReader = () => {
    setReaderOpen(false);
    setHlToolbar(h => ({ ...h, visible: false }));
  };

  useEffect(() => {
    if (!readerOpen) return;
    const rc = readerContentRef.current;
    if (!rc) return;

    rc.innerHTML = '';
    translatedPages.forEach(tp => appendToReader(tp, rc));
    const first = rc.querySelector('.page') as HTMLElement | null;
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [readerOpen, translatedPages]);

  /* ─── Chat ─── */
  const sendChat = async (prefill?: string) => {
    const q = prefill ?? chatInput.trim();
    if (!q) return;
    setChatInput('');
    if (!chatOpen) setChatOpen(true);
    setChatMessages(m => [...m, { text: q, role: 'user' }, { text: 'Tahlil qilmoqda...', role: 'thinking' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, bookContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setChatMessages(m => {
        const copy = [...m];
        copy[copy.length - 1] = { text: data.answer, role: 'ai' };
        return copy;
      });
    } catch (e) {
      setChatMessages(m => {
        const copy = [...m];
        copy[copy.length - 1] = { text: '❌ ' + (e instanceof Error ? e.message : 'Xatolik'), role: 'ai' };
        return copy;
      });
    }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  /* ─── Highlight ─── */
  const onTextSelect = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.toString().trim().length < 2) {
      setHlToolbar(h => ({ ...h, visible: false })); return;
    }
    currentSelRef.current = sel;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setHlToolbar({ x: rect.left + rect.width / 2, y: rect.top - 58, visible: true });
  }, []);

  const applyHighlight = (color: 'yellow' | 'green') => {
    const sel = currentSelRef.current;
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.className = 'hl-' + color;
    if (!highlightsVisible) mark.classList.add('hl-hidden');
    try { range.surroundContents(mark); } catch { console.warn('Complex selection'); }
    window.getSelection()?.removeAllRanges();
    setHlToolbar(h => ({ ...h, visible: false }));
  };

  const removeHighlight = () => {
    if (selectedMarkRef.current) {
      const mark = selectedMarkRef.current;
      const parent = mark.parentNode!;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      selectedMarkRef.current = null;
      setHlToolbar(h => ({ ...h, visible: false }));
      return;
    }
    const sel = currentSelRef.current;
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    document.querySelectorAll('mark.hl-yellow,mark.hl-green').forEach(m => {
      if (range.intersectsNode(m)) {
        const p = m.parentNode!;
        while (m.firstChild) p.insertBefore(m.firstChild, m);
        p.removeChild(m);
      }
    });
    window.getSelection()?.removeAllRanges();
    setHlToolbar(h => ({ ...h, visible: false }));
  };

  const askAiFromSelection = () => {
    const text = currentSelRef.current?.toString().trim() ?? '';
    setHlToolbar(h => ({ ...h, visible: false }));
    if (!text) return;
    sendChat(`Bu qism haqida tushuntir: "${text.slice(0, 400)}"`);
  };

  /* ─── Download PDF ─── */
  const downloadPDF = async () => {
    if (translatedPages.length === 0) { toast.error('Avval tarjima qiling'); return; }
    toast.loading('PDF tayyorlanmoqda...');
    try {
      // @ts-expect-error: jspdf loaded via CDN
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 44, contentW = pageW - margin * 2;
      let isFirst = true;
      for (const tp of translatedPages) {
        if (!tp.text && !tp.canvas) continue;
        if (!isFirst) pdf.addPage(); isFirst = false;
        let y = margin;
        if (tp.canvas) {
          const imgData = tp.canvas.toDataURL('image/jpeg', 0.85);
          const ratio = tp.canvas.height / tp.canvas.width;
          const imgW = contentW, imgH = imgW * ratio, maxH = pageH * 0.5;
          const fW = imgH > maxH ? maxH / ratio : imgW;
          const fH = imgH > maxH ? maxH : imgH;
          pdf.addImage(imgData, 'JPEG', margin + (contentW - fW) / 2, y, fW, fH);
          y += fH + 16;
          pdf.setDrawColor(60, 80, 120); pdf.setLineWidth(0.4);
          pdf.line(margin, y, pageW - margin, y); y += 14;
        }
        if (tp.text) {
          pdf.setFontSize(11); pdf.setTextColor(25, 25, 35);
          const lines = pdf.splitTextToSize(tp.text, contentW);
          const lh = 11 * 1.65;
          for (const line of lines) {
            if (y + lh > pageH - margin) { pdf.addPage(); y = margin; }
            pdf.text(line, margin, y); y += lh;
          }
        }
      }
      const name = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'tarjima';
      pdf.save(`${name}_${selectedLanguage ?? 'translated'}.pdf`);
      toast.dismiss();
      toast.success('PDF yuklandi!');
    } catch (e) {
      toast.dismiss();
      toast.error('PDF yaratishda xatolik: ' + (e instanceof Error ? e.message : ''));
    }
  };

  /* ─── Clear file ─── */
  const clearFile = () => {
    setSelectedFile(null); setPdfPages([]); setTranslatedPages([]);
    setFileStatus(''); setError('');
    if (originalViewerRef.current) originalViewerRef.current.innerHTML = '<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">Kitob yuklanmagan</div><div class="empty-sub">Chap paneldan PDF yoki TXT fayl yuklang</div></div>';
    if (translatedViewerRef.current) translatedViewerRef.current.innerHTML = '<div class="empty-state"><div class="empty-icon">🌍</div><div class="empty-title">Tarjima natijasi</div><div class="empty-sub">Tarjima boshlanganida bu yerda ko\'rinadi</div></div>';
  };

  const bannerClass = bannerVisible ? 'with-banner' : 'no-banner';

  return (
    <>
      {/* PDF.js CDN */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" async />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" async />

      {/* Beta Banner */}
      {bannerVisible && (
        <div className="banner" id="testBanner">
          <div className="banner-pulse" />
          🧪 Sinov versiyasi — LinguaBook PRO Beta
          <div className="banner-pulse" />
          <button className="banner-close" onClick={closeBanner}>✕</button>
        </div>
      )}

      {/* Header */}
      <Header hasBanner={bannerVisible} />

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      {/* MAIN LAYOUT */}
      <div className={`layout ${bannerClass}`} id="mainLayout">
        {/* SIDEBAR */}
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
          <div className="sidebar-scroll">
            {/* File upload */}
            <div className="s-section">
              <div className="s-label">📂 Kitob yuklash</div>
              <label className="dropzone" id="dropZone"
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
                onDragLeave={e => e.currentTarget.classList.remove('drag')}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag'); const f = e.dataTransfer.files[0]; if (f) handleFileChange(f); }}
              >
                <input hidden type="file" accept=".pdf,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }} />
                <span className="dz-icon">📖</span>
                <div className="dz-title">PDF yoki TXT yuklang</div>
                <div className="dz-sub">Bosing yoki sudrab tashlang</div>
              </label>
              {selectedFile && (
                <div className="file-chip show">
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span className="file-chip-name">{selectedFile.name}</span>
                  <button className="file-chip-clear" onClick={clearFile}>✕</button>
                </div>
              )}
              {fileStatus && <div className="s-status">{fileStatus}</div>}
              {error && <div className="s-error">{error}</div>}
            </div>

            {/* Language */}
            <div className="s-section">
              <div className="s-label">🌐 Tarjima tili</div>
              <div className="lang-grid">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    className={`lang-btn ${selectedLanguage === lang ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {LANG_EMOJI[lang] ?? '🌐'} {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Translate */}
            <div className="s-section">
              <button className="translate-btn" onClick={startTranslation} disabled={isTranslating}>
                {isTranslating ? '⏳ Tarjima qilinmoqda...' : '⚡ Tarjima qilish'}
              </button>
              {pdfPages.length > 0 && (
                <div className="s-status">Narx: {translationCost} LC ({pdfPages.length} sahifa)</div>
              )}
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div className="progress-fill" id="progressFill" style={{ width: `${progress}%` }} />
                </div>
                {status && <div className="s-status">{status}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          <div className="viewer">
            {/* Original panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div className="panel-title-dot blue" />
                  Asl nusxa
                </div>
              </div>
              <div className="panel-body" ref={originalViewerRef}>
                <div className="empty-state">
                  <div className="empty-icon">📄</div>
                  <div className="empty-title">Kitob yuklanmagan</div>
                  <div className="empty-sub">Chap paneldan PDF yoki TXT fayl yuklang</div>
                </div>
              </div>
            </div>

            {/* Translated panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div className="panel-title-dot green" />
                  Tarjima
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="reader-open-btn" onClick={openReader} title="O'qish rejimi">⛶</button>
                  <button className="reader-open-btn" onClick={downloadPDF} title="PDF yuklab olish">⬇</button>
                </div>
              </div>
              <div className="panel-body" ref={translatedViewerRef}>
                <div className="empty-state">
                  <div className="empty-icon">🌍</div>
                  <div className="empty-title">Tarjima natijasi</div>
                  <div className="empty-sub">Tarjima boshlanganida bu yerda ko&apos;rinadi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* READER OVERLAY */}
      <div className={`reader-overlay ${readerOpen ? 'active' : ''}`} id="readerOverlay">
        <div className="reader-modal">
          <div className="reader-top">
            <div className="reader-top-title">
              <span style={{ fontSize: 18 }}>📖</span>
              O&apos;qish rejimi
            </div>
            <div className="reader-tools">
              <button className={`rtool ${highlightMode ? 'active' : ''}`} onClick={() => setHighlightMode(!highlightMode)}>
                🖊 Belgilash
              </button>
              <button className={`rtool ${!highlightsVisible ? 'active' : ''}`}
                onClick={() => {
                  setHighlightsVisible(!highlightsVisible);
                  document.querySelectorAll('mark.hl-yellow,mark.hl-green').forEach(m => m.classList.toggle('hl-hidden', highlightsVisible));
                }}>
                👁 Ko&apos;rinish
              </button>
              <button className={`rtool ${chatOpen ? 'active' : ''}`} onClick={() => setChatOpen(!chatOpen)}>
                🤖 AI Tahlil
              </button>
              <button className="rtool" onClick={downloadPDF}>⬇ PDF saqlash</button>
              <button className="reader-close" onClick={closeReader}>✕</button>
            </div>
          </div>
          <div className="reader-body">
            <div
              className="reader-content"
              ref={readerContentRef}
              onMouseUp={highlightMode ? onTextSelect : undefined}
              onTouchEnd={highlightMode ? onTextSelect : undefined}
            />
            {/* Chat panel */}
            <div className={`chat-panel ${chatOpen ? 'open' : ''}`}>
              <div className="chat-header">
                <div className="chat-header-icon">🤖</div>
                AI Kitob Tahlilchi
              </div>
              <div className="chat-messages">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`chat-msg ${m.role}`}>{m.text}</div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-row">
                <input
                  className="chat-input"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Savol yozing..."
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                />
                <button className="chat-send" onClick={() => sendChat()}>➤</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HIGHLIGHT TOOLBAR */}
      {hlToolbar.visible && (
        <div className="hl-toolbar visible" style={{ left: Math.max(8, hlToolbar.x - 130), top: Math.max(8, hlToolbar.y) }}>
          <button className="ht-btn yellow" onClick={() => applyHighlight('yellow')}>🟡 Sariq</button>
          <button className="ht-btn green" onClick={() => applyHighlight('green')}>🟢 Yashil</button>
          <div className="ht-sep" />
          <button className="ht-btn ask" onClick={askAiFromSelection}>🤖 AI</button>
          <div className="ht-sep" />
          <button className="ht-btn remove" onClick={removeHighlight}>✕</button>
        </div>
      )}

      {/* MOBILE WIZARD */}
      <div className={`mwiz ${bannerClass}`} id="mwiz">
        <div className="mwiz-bar">
          {['📂', '🌐', '⚡'].map((icon, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div className={`mwiz-step ${mStep > i ? 'done' : mStep === i ? 'active' : ''}`}
                onClick={() => mStep > i && setMStep(i)}>
                <div className="mwiz-step-circle">{icon}</div>
                <div className="mwiz-step-label">{['Kitob', 'Til', 'Tarjima'][i]}</div>
              </div>
              {i < 2 && <div className={`mwiz-conn ${mStep > i ? 'done' : ''}`} />}
            </div>
          ))}
        </div>
        <div className="mwiz-panels">
          {/* Step 0: Upload */}
          <div className={`mwiz-panel ${mStep === 0 ? 'active' : mStep > 0 ? 'left' : ''}`}>
            <div className="mwiz-card">
              <div className="mwiz-card-title">📂 Kitob yuklash</div>
              <div className="mwiz-card-sub">PDF yoki TXT formatdagi kitobni tanlang</div>
              <label className="mwiz-upload">
                <input hidden type="file" accept=".pdf,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }} />
                <span className="mwiz-upload-icon">📖</span>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Bosib faylni tanlang</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>PDF yoki TXT qabul qilinadi</div>
              </label>
              {selectedFile && <div className="file-chip show" style={{ marginTop: 10 }}><span>📄</span><span className="file-chip-name">{selectedFile.name}</span><button className="file-chip-clear" onClick={clearFile}>✕</button></div>}
              {fileStatus && <div className="s-status">{fileStatus}</div>}
            </div>
          </div>
          {/* Step 1: Language */}
          <div className={`mwiz-panel ${mStep === 1 ? 'active' : mStep > 1 ? 'left' : ''}`}>
            <div className="mwiz-card">
              <div className="mwiz-card-title">🌐 Tarjima tilini tanlang</div>
              <div className="mwiz-card-sub">Qaysi tilga tarjima qilinsin?</div>
              <div className="mwiz-lang-grid">
                {LANGUAGES.map(lang => (
                  <button key={lang} className={`mwiz-lang-btn ${selectedLanguage === lang ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage(lang)}>
                    {LANG_EMOJI[lang]} {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Step 2: Translate */}
          <div className={`mwiz-panel ${mStep === 2 ? 'active' : ''}`}>
            <div className="mwiz-prog-wrap">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>⚡ Tarjima jarayoni</div>
              <div className="mwiz-prog-bar"><div className="mwiz-prog-fill" style={{ width: `${progress}%` }} /></div>
              <div className="mwiz-prog-status">{status || 'Tayyor, tarjimani boshlang!'}</div>
              <button className="mwiz-translate-btn" disabled={isTranslating} onClick={startTranslation}>
                {isTranslating ? '⏳ Tarjima qilinmoqda...' : '⚡ Tarjima boshlash'}
              </button>
            </div>
            <button className="mwiz-reader-btn" disabled={translatedPages.length === 0} onClick={openReader}>
              📖 O&apos;qish rejimida ko&apos;rish
            </button>
          </div>
        </div>
        <div className="mwiz-nav">
          {mStep > 0 && <button className="mwiz-btn-back" onClick={() => setMStep(s => s - 1)}>← Orqaga</button>}
          {mStep === 2 && translatedPages.length > 0 && (
            <button className="mwiz-btn-dl" onClick={downloadPDF}>⬇ PDF</button>
          )}
          {mStep < 2 && (
            <button className="mwiz-btn-next" onClick={() => {
              if (mStep === 0 && !selectedFile) { toast.error('Kitob yuklang'); return; }
              if (mStep === 1 && !selectedLanguage) { toast.error('Tilni tanlang'); return; }
              setMStep(s => s + 1);
            }}>
              Davom etish →
            </button>
          )}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
