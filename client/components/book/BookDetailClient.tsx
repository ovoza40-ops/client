'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabase';
import { Book, Rating, Chapter } from '@/lib/types';
import { LANG_EMOJI } from '@/lib/constants';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Props { bookId: string; }

export default function BookDetailClient({ bookId }: Props) {
  const { user, isPremium } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [readMode, setReadMode] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => { fetchBook(); }, [bookId]);

  const fetchBook = async () => {
    setLoading(true);
    const { data: bookData } = await supabase
      .from('books')
      .select('*, uploader:profiles(full_name, role), chapters(*), ratings(*, user:profiles(full_name))')
      .eq('id', bookId)
      .single();

    if (bookData) {
      const b = bookData as Book & { chapters: Chapter[]; ratings: Rating[] };
      setBook(b);
      setChapters((b.chapters ?? []).sort((a: Chapter, b: Chapter) => a.chapter_number - b.chapter_number));
      setRatings(b.ratings ?? []);
      // Increment reads
      await supabase.from('books').update({ total_reads: (b.total_reads ?? 0) + 1 }).eq('id', bookId);
    }
    setLoading(false);
  };

  const submitRating = async () => {
    if (!user) { toast.error('Kirish kerak'); return; }
    if (!myRating) { toast.error('Yulduzcha tanlang'); return; }
    setSubmittingRating(true);
    const { error } = await supabase.from('ratings').upsert({
      book_id: bookId,
      user_id: user.id,
      stars: myRating,
      comment: myComment || null,
    });
    if (error) toast.error('Xatolik: ' + error.message);
    else { toast.success('Reytingingiz saqlandi!'); setMyRating(0); setMyComment(''); fetchBook(); }
    setSubmittingRating(false);
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
          <div>Yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Kitob topilmadi</div>
            <Link href="/translate" className="btn btn-primary" style={{ marginTop: 20 }}>← Tarjima sahifasiga qaytish</Link>
        </div>
      </div>
    );
  }

  const avgStars = book.avg_rating ? Math.round(book.avg_rating) : 0;

  return (
    <div style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Book header */}
      <div style={{ background: 'linear-gradient(135deg, var(--surface), var(--surface2))', borderBottom: '1px solid var(--border)', padding: '32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <div style={{ width: 120, height: 160, borderRadius: 16, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, flexShrink: 0, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
            📖
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {book.is_paid
                ? <span className="badge badge-paid">💰 Pullik</span>
                : <span className="badge badge-free">✅ Bepul</span>}
              {book.translated_language && (
                <span className="badge badge-new">{LANG_EMOJI[book.translated_language]} {book.translated_language}</span>
              )}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, lineHeight: 1.3 }}>{book.title}</h1>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {'⭐'.repeat(avgStars)}{'☆'.repeat(5 - avgStars)}
              <span style={{ fontSize: 13, color: 'var(--text2)', marginLeft: 4 }}>({ratings.length} ta reyting)</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text2)', marginBottom: 20, flexWrap: 'wrap' }}>
              <span>📄 {book.page_count} sahifa</span>
              <span>👁 {book.total_reads} o&apos;qildi</span>
              {book.original_language && <span>Asl: {book.original_language}</span>}
              <span>👤 {(book.uploader as {full_name?:string})?.full_name ?? 'Noma\'lum'}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setReadMode(true)}>
                📖 O&apos;qish
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Chapters list */}
        {chapters.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📑 Boblar</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chapters.map((ch, i) => (
                <div key={ch.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text2)', flexShrink: 0 }}>
                    {ch.chapter_number}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{ch.title ?? `Bob ${ch.chapter_number}`}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      {ch.content.length} ta belgi
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating section */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>⭐ Reyting va Izohlar</h2>

          {/* Add rating form */}
          {user && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 14 }}>Reytingingizni qoldiring</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setMyRating(s)}
                    style={{ fontSize: 28, cursor: 'pointer', background: 'none', border: 'none', transition: 'transform 0.15s', transform: myRating >= s ? 'scale(1.15)' : 'scale(1)' }}>
                    {myRating >= s ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <textarea
                className="form-input"
                style={{ resize: 'vertical', minHeight: 80, marginBottom: 12 }}
                placeholder="Izoh yozing (ixtiyoriy)..."
                value={myComment}
                onChange={e => setMyComment(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={submitRating} disabled={submittingRating || !myRating}>
                {submittingRating ? '⏳ Saqlanmoqda...' : '✅ Reyting qo\'ldirish'}
              </button>
            </div>
          )}

          {/* Ratings list */}
          {ratings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              Hali reyting yo&apos;q. Birinchi bo&apos;ling!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ratings.map(r => (
                <div key={r.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                        {((r.user as {full_name?:string})?.full_name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{(r.user as {full_name?:string})?.full_name ?? 'Foydalanuvchi'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text2)' }}>{new Date(r.created_at).toLocaleDateString('uz-UZ')}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 16 }}>{'⭐'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
                  </div>
                  {r.comment && <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{r.comment}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Read mode overlay */}
      {readMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'var(--bg)', overflow: 'auto' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>📖 {book.title}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setReadMode(false)}>✕ Yopish</button>
          </div>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
            {chapters.length > 0 ? chapters.map(ch => (
              <div key={ch.id} style={{ marginBottom: 60, paddingBottom: 48, borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>
                  {ch.title ?? `Bob ${ch.chapter_number}`}
                </h2>
                <div style={{ fontSize: 17, lineHeight: 2.1, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                  {ch.content}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
                <div style={{ fontSize: 50, marginBottom: 16 }}>📭</div>
                <div>Bu kitob uchun o&apos;qish matni mavjud emas</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
