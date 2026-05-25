'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabase';
import { Book, Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminClient() {
  const { user, isAdmin, profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'books' | 'users' | 'wallet' | 'stats'>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ totalBooks: 0, totalUsers: 0, premiumUsers: 0, totalReads: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    if (!isAdmin && profile !== null) { router.push('/'); toast.error('Ruxsat yo\'q'); return; }
    if (isAdmin) { fetchData(); }
  }, [user, isAdmin, profile]);

  const fetchData = async () => {
    setLoading(true);
    const [booksRes, usersRes] = await Promise.all([
      supabase.from('books').select('*, uploader:profiles(full_name)').order('created_at', { ascending: false }).limit(100),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    const bs = (booksRes.data ?? []) as Book[];
    const us = (usersRes.data ?? []) as Profile[];
    setBooks(bs);
    setUsers(us);
    setStats({
      totalBooks: bs.length,
      totalUsers: us.length,
      premiumUsers: us.filter(u => u.role === 'premium').length,
      totalReads: bs.reduce((s, b) => s + (b.total_reads ?? 0), 0),
    });
    setLoading(false);
  };

  const setUserAmount = (userId: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [userId]: value }));
  };

  const adjustWallet = async (user: Profile, amount: number) => {
    if (!user.id) return;
    if (!amount || Number.isNaN(amount)) {
      toast.error('Iltimos, miqdorni to‘g‘ri kiriting');
      return;
    }

    const currentBalance = Number(user.wallet_balance ?? 0);
    if (amount < 0 && currentBalance + amount < 0) {
      toast.error('Balans manfiyga tushmaydi');
      return;
    }

    const { error: rpcError } = await supabase.rpc('increment_wallet', {
      user_id: user.id,
      amount,
    });
    if (rpcError) {
      toast.error('Walletni yangilashda xatolik yuz berdi');
      return;
    }

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: amount > 0 ? 'earning' : 'withdrawal',
      amount,
      description: amount > 0
        ? `Admin tomonidan ${amount} LC berildi`
        : `Admin tomonidan ${Math.abs(amount)} LC yechildi`,
    });
    if (txError) {
      toast.error('Tranzaksiya yozuvini saqlashda xatolik yuz berdi');
      return;
    }

    toast.success(`Foydalanuvchi balansini ${amount > 0 ? 'to‘ldirdingiz' : 'kamaytirdingiz'}`);
    setAmounts((prev) => ({ ...prev, [user.id]: '' }));
    fetchData();
  };

  const giveCoins = async (user: Profile) => {
    const amount = Number(amounts[user.id] ?? 0);
    if (amount <= 0) {
      toast.error('Iltimos, musbat miqdor kiriting');
      return;
    }
    await adjustWallet(user, amount);
  };

  const removeCoins = async (user: Profile) => {
    const amount = Number(amounts[user.id] ?? 0);
    if (amount <= 0) {
      toast.error('Iltimos, musbat miqdor kiriting');
      return;
    }
    await adjustWallet(user, -amount);
  };

  const takedownBook = async (bookId: string) => {
    if (!confirm('Bu kitobni o\'chirmoqchimisiz? (DMCA Takedown)')) return;
    const { error } = await supabase
      .from('books')
      .update({ status: 'removed', is_public: false })
      .eq('id', bookId);
    if (error) toast.error('Xatolik');
    else { toast.success('Kitob o\'chirildi (DMCA Takedown)'); fetchData(); }
  };

  const changeUserRole = async (userId: string, role: 'freemium' | 'premium' | 'admin') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) toast.error('Xatolik');
    else { toast.success('Rol o\'zgartirildi'); fetchData(); }
  };

  const blockUser = async (userId: string) => {
    if (!confirm('Foydalanuvchini bloklash?')) return;
    // In real app: disable auth user
    toast('Bu funksiya tez orada qo\'shiladi', { icon: '🔧' });
  };

  if (!isAdmin) {
    return (
      <div style={{ paddingTop: 'var(--header-h)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Ruxsat yo&apos;q</div>
          <p style={{ color: 'var(--text2)', marginTop: 8 }}>Bu sahifaga faqat adminlar kira oladi</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Admin header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🛡 Admin Panel</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>LinguaBook Pro boshqaruv markazi</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Jami kitoblar', val: stats.totalBooks, icon: '📚', color: 'var(--accent)' },
            { label: 'Jami foydalanuvchilar', val: stats.totalUsers, icon: '👤', color: 'var(--green)' },
            { label: 'Premium foydalanuvchilar', val: stats.premiumUsers, icon: '⭐', color: '#b39bff' },
            { label: 'Jami o\'qishlar', val: stats.totalReads, icon: '👁', color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, width: 'fit-content' }}>
          {(['books', 'users', 'wallet', 'stats'] as const).map(tab => (
            <button
              key={tab}
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'books' ? '📚 Kitoblar' : tab === 'users' ? '👤 Foydalanuvchilar' : tab === 'wallet' ? '🪙 LC Boshqaruvi' : '📊 Statistika'}
            </button>
          ))}
        </div>

        {/* Books management */}
        {activeTab === 'books' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Yuklanmoqda...</div>
            ) : books.map(book => (
              <div key={book.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📖</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    <span>{book.translated_language}</span>
                    <span style={{ color: book.is_public ? 'var(--green)' : 'var(--text3)' }}>
                      {book.is_public ? '🌐 Ommaviy' : '🔒 Xususiy'}
                    </span>
                    <span style={{ color: book.status === 'removed' ? 'var(--red)' : 'var(--text2)' }}>
                      {book.status}
                    </span>
                    <span>👁 {book.total_reads}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {book.status !== 'removed' && (
                    <button className="btn btn-danger btn-sm" onClick={() => takedownBook(book.id)}>
                      ⚠️ DMCA Takedown
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users management */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Yuklanmoqda...</div>
            ) : users.map(u => (
              <div key={u.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px' }}>
                <div className="profile-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                  {(u.full_name?.[0] ?? '?').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name ?? 'Noma\'lum'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', gap: 8, marginTop: 2 }}>
                    <span className={`badge badge-${u.role === 'premium' ? 'premium' : u.role === 'admin' ? 'new' : 'free'}`} style={{ fontSize: 10 }}>
                      {u.role}
                    </span>
                    <span>💰 {(u.wallet_balance ?? 0).toLocaleString()} LC</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {u.role !== 'premium' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => changeUserRole(u.id, 'premium')}>
                      ⭐ Premium
                    </button>
                  )}
                  {u.role !== 'admin' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => changeUserRole(u.id, 'admin')}>
                      🛡 Admin
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => blockUser(u.id)}>
                    🚫 Bloklash
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wallet distribution */}
        {activeTab === 'wallet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Yuklanmoqda...</div>
            ) : users.map(u => (
              <div key={u.id} className="card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '12px 16px' }}>
                <div className="profile-avatar" style={{ width: 36, height: 36, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(u.full_name?.[0] ?? '?').toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name ?? 'Noma\'lum'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    <span>{u.role}</span>
                    <span>💰 {(u.wallet_balance ?? 0).toLocaleString()} LC</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="1"
                      value={amounts[u.id] ?? ''}
                      onChange={(e) => setUserAmount(u.id, e.target.value)}
                      placeholder="Miqdor"
                      style={{ width: 120, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => giveCoins(u)}>
                      + Berish
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => removeCoins(u)}>
                      - Olish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {activeTab === 'stats' && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Batafsil statistika</div>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Grafik va analytics tez orada qo&apos;shiladi</p>
          </div>
        )}
      </div>
    </div>
  );
}
