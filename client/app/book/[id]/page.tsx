import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import BookDetailClient from '@/components/book/BookDetailClient';

export const metadata: Metadata = {
  title: 'Kitob — LinguaBook Pro',
  description: 'Kitobni o\'qing, audio eshiting, reyting bering va izoh yozing.',
};

export default function BookPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Header />
      <BookDetailClient bookId={params.id} />
    </>
  );
}
