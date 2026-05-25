import Link from 'next/link';
import Header from '@/components/layout/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LinguaBook Pro — AI-Powered Book Translator & Marketplace',
  description: 'AI yordamida kitoblarni istalgan tilga tarjima qiling, o\'qing, audio eshiting va daromad toping. O\'zbekistonning birinchi AI kitob platformasi.',
};

export default function HomePage() {
  return (
    <>
      <Header hasBanner />
      {/* Banner */}
      <div className="banner">
        <div className="banner-pulse" />
        🧪 Sinov versiyasi — LinguaBook PRO Beta
        <div className="banner-pulse" />
      </div>

      {/* Hero Section */}
      <div className="auth-gate" style={{ position: 'relative', zIndex: 'auto', overflow: 'visible', minHeight: '100vh' }}>
        <div className="hero-bg" />
        <div className="grid-noise" />
        <div className="floating-orb orb1" />
        <div className="floating-orb orb2" />

        <div className="landing-wrap" style={{ paddingTop: 100 }}>
          <div className="hero-left">
            <div className="hero-badge">✨ Premium AI Reading Experience · LinguaBook PRO</div>
            <h1 className="hero-title">
              Kitoblarni <span>Istalgan Tilga</span><br />AI bilan Tarjima Qiling
            </h1>
            <p className="hero-sub">
              O&apos;zbek, rus, ingliz tillaridagi kitoblarni bir zumda tarjima qiling.
              Belgilang, AI bilan tahlil qiling va qulay o'qish tajribasini yoqing.
            </p>

            <div className="hero-actions">
              <Link href="/translate" className="hero-btn primary">
                ⚡ Tarjima boshlash
              </Link>
            </div>

            <div className="hero-cards">
              <div className="feature-card">
                <h4>⚡ Tezkor Tarjima</h4>
                <p>GPT-4o-mini orqali sahifama-sahifa professional tarjima. O&apos;rtacha 300 sahifali kitob ~$0.15.</p>
              </div>
              <div className="feature-card">
                <h4>📖 Immersive O&apos;qish</h4>
                <p>Belgilash, AI tahlil va tungi rejim bilan qulay o&apos;qish tajribasi.</p>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-ring ring1" />
            <div className="visual-ring ring2" />
            <div className="glass-book">
              <div className="book-glow" />
              <div className="book-card-visual">
                <div className="book-top">
                  <div className="mini-pill">AI Powered Reader</div>
                  <div className="mini-status" />
                </div>
                <div className="book-lines">
                  <span /><span /><span /><span />
                </div>
                <div className="floating-cube cube1" />
                <div className="floating-cube cube2" />
                <div className="floating-cube cube3" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div style={{ position: 'relative', zIndex: 2, padding: '60px 40px', display: 'flex', justifyContent: 'center', gap: 60, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { val: '11+', label: 'Til' },
            { val: 'GPT-4o', label: 'AI Model' },
            { val: '100%', label: 'Xavfsiz' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, background: 'linear-gradient(135deg,#7db3ff,#b39bff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.val}</div>
              <div style={{ fontSize: 13, color: '#8899b8', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ position: 'relative', zIndex: 2, padding: '80px 40px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8ea2c9', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Qanday ishlaydi</div>
          <h2 style={{ fontSize: 42, color: 'white', fontWeight: 800, marginBottom: 50, letterSpacing: -1 }}>3 ta qadamda tayyor</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { step: '01', icon: '📂', title: 'Kitob yuklang', desc: 'PDF, TXT formatdagi kitobingizni yuklang. Drag & drop qilsangiz ham bo\'ladi.' },
              { step: '02', icon: '🌐', title: 'Tilni tanlang', desc: '11 ta tildan birini tanlang. AI kitobning asl tilini ham o\'zi aniqlaydi.' },
              { step: '03', icon: '✨', title: 'Tarjimani oling', desc: 'Sahifama-sahifa tarjima. O\'qing yoki PDF yuklab oling.' },
            ].map(item => (
              <div key={item.step} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '28px 24px', textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: '#4f8ef7', fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>QADAM {item.step}</div>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 10 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#8899b8', lineHeight: 1.8 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 60 }}>
            <Link href="/translate" className="hero-btn primary" style={{ fontSize: 16, padding: '18px 36px' }}>
              ⚡ Hozir boshlang — Bepul
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
