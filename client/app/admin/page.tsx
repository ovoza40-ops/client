import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import AdminClient from '@/components/admin/AdminClient';

export const metadata: Metadata = {
  title: 'Admin Panel — LinguaBook Pro',
  description: 'LinguaBook Pro admin boshqaruv paneli',
};

export default function AdminPage() {
  return (
    <>
      <Header />
      <AdminClient />
    </>
  );
}
