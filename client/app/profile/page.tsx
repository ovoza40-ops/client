import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import ProfileClient from '@/components/profile/ProfileClient';
import { Suspense } from 'react';


export const metadata: Metadata = {
  title: 'Mening Profilim — LinguaBook Pro',
  description: 'Foydalanuvchi profili — kitoblar, hamyon, obuna va sozlamalar.',
};

export default function ProfilePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div style={{ paddingTop: 'var(--header-h)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text2)' }}>Yuklanmoqda...</div>}>
        <ProfileClient />
      </Suspense>
    </>
  );
}
