'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabase';
import { Book, Transaction } from '@/lib/types';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

const TABS = ['books', 'wallet', 'sell'];
const TAB_LABELS: Record<string, string> = {
  books: '📚 Kitoblarim',
  wallet: '🪙 LinguaCoin',
  sell: '🛒 Kitob sotish',
};

export default function ProfileClient() {
  const { user, profile, isPremium, isAdmin, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'books');
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    fetchMyBooks();
    fetchTransactions();
  }, [user]);

  const fetchMyBooks = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('uploader_id', user.id)
      .order('created_at', { ascending: false });
    setMyBooks((data as Book[]) ?? []);
    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setTransactions((data as Transaction[]) ?? []);
  };

  const upgradeToPremium = async () => {
    if (!user) return;
    setUpgradingPremium(true);
    // Mock premium upgrade
    await new Promise(r => setTimeout(r, 1500)); // simulate payment
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'premium' })
      .eq('id', user.id);

    if (error) { toast.error('Xatolik yuz berdi'); }
    else {
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'subscription',
        amount: -PREMIUM_PRICE_UZS,
        description: 'Premium obuna (1 oy)',
      });
      await refreshProfile();
      toast.success('🎉 Premium bo\'ldingiz! Barcha imkoniyatlar ochildi.');
    }
    setUpgradingPremium(false);
  };

  const publishBook = async (bookId: string, isPublic: boolean, isPaid: boolean, price: number) => {
    const { error } = await supabase
      .from('books')
      .update({ is_public: isPublic, is_paid: isPaid, price })
      .eq('id', bookId);
    if (error) toast.error('Xatolik');
    else { toast.success('Kitob yangilandi!'); fetchMyBooks(); }
  };

  const takedownBook = async (bookId: string) => {
    const { error } = await supabase
      .from('books')
      .update({ status: 'removed', is_public: false })
      .eq('id', bookId);
    if (error) toast.error('Xatolik');
    else { toast.success('Kitob o\'chirildi'); fetchMyBooks(); }
  };

  if (!user) return null;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0] ?? 'U').toUpperCase();

  return (
    <div style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Profile header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div className="profile-avatar">{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                {profile?.full_name ?? user.email}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {isPremium
                  ? <span className="badge badge-premium">⭐ Premium</span>
                  : <span className="badge badge-free">Freemium</span>}
                {isAdmin && <span className="badge badge-new">🛡 Admin</span>}
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>📅 {new Date(profile?.created_at ?? '').toLocaleDateString('uz-UZ')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {isAdmin && <Link href="/admin" className="btn btn-secondary btn-sm">🛡 Admin panel</Link>}
              <button className="btn btn-ghost btn-sm" onClick={signOut}>Chiqish</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 6 }}>
          {(isPremium ? TABS : TABS.filter(t => t !== 'sell')).map(tab => (
            <button
              key={tab}
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, fontSize: 12 }}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Books tab */}
        {activeTab === 'books' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Mening kitoblarim</h2>
              <Link href="/translate" className="btn btn-primary btn-sm">+ Yangi kitob</Link>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Yuklanmoqda...</div>
            ) : myBooks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>📚</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Hali kitob yo&apos;q</div>
                <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
                  Birinchi kitobingizni tarjima qiling!
                </p>
                <Link href="/translate" className="btn btn-primary">⚡ Kitob tarjima qilish</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myBooks.map(book => (
                  <div key={book.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📖</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 10 }}>
                        <span>{book.translated_language}</span>
                        <span>📄 {book.page_count} sahifa</span>
                        <span style={{ color: book.is_public ? 'var(--green)' : 'var(--text3)' }}>
                          {book.is_public ? '🌐 Ommaviy' : '🔒 Xususiy'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/book/${book.id}`} className="btn btn-secondary btn-sm">Ko&apos;rish</Link>
                      {isPremium && !book.is_public && (
                        <button className="btn btn-primary btn-sm" onClick={() => publishBook(book.id, true, false, 0)}>
                          Nashr qilish
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => takedownBook(book.id)}>O&apos;chirish</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LinguaCoin (Wallet) tab */}
        {activeTab === 'wallet' && (
          <div>
            <div className="wallet-card" style={{ marginBottom: 24 }}>
              <div className="wallet-label">🪙 LinguaCoin Balansi</div>
              <div className="wallet-balance">{(profile?.wallet_balance ?? 0).toLocaleString()} LC</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>Chiqarish uchun so'rov yuboring — minimal chegarasi yo'q.</div>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
                onClick={() => toast('Chiqarish so\'rovi yuborildi!', { icon: '✅' })}
              >
                💸 Chiqarish
              </button>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Tranzaksiya Tarixi</h3>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
                Hali tranzaksiya yo&apos;q
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {transactions.map(t => (
                  <div key={t.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                        {new Date(t.created_at).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: t.amount > 0 ? 'var(--green)' : 'var(--red)', fontSize: 14 }}>
                      {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} LC
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {/* Sell tab (Premium only) */}
        {activeTab === 'sell' && isPremium && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🛒 Kitob sotish</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24, lineHeight: 1.8 }}>
              Tarjima qilgan kitoblaringizni marketplacega chiqaring. Har bir sotuvdan <strong style={{ color: 'var(--green)' }}>70%</strong> daromad olasiz.
            </p>
            {myBooks.filter(b => !b.is_public && b.status === 'ready').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>
                  Sotish uchun tayyor kitob yo&apos;q. Avval kitob tarjima qiling.
                </div>
                <Link href="/translate" className="btn btn-primary">⚡ Kitob tarjima qilish</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myBooks.filter(b => !b.is_public && b.status === 'ready').map(book => (
                  <SellBookCard key={book.id} book={book} onPublish={publishBook} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SellBookCard({ book, onPublish }: { book: Book; onPublish: (id: string, pub: boolean, paid: boolean, price: number) => void }) {
  const [price, setPrice] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{book.title}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              Pullik qilish
            </label>
            {isPaid && (
              <input
                type="number"
                className="form-input"
                style={{ width: 160, padding: '6px 10px', fontSize: 13 }}
                placeholder="Narx (so'm)"
                value={price || ''}
                onChange={e => setPrice(Number(e.target.value))}
                min={0}
              />
            )}
            {isPaid && price > 0 && (
              <span style={{ fontSize: 12, color: 'var(--green)' }}>
                Sizga: {(price * 0.7).toLocaleString()} so&apos;m
              </span>
            )}
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onPublish(book.id, true, isPaid, isPaid ? price : 0)}
        >
          🚀 Nashr qilish
        </button>
      </div>
    </div>
  );
}
