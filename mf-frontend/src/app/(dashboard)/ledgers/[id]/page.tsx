'use client';

import { LedgerDetailScreen } from '@/src/screens/LedgerScreen/LedgerDetailScreen';
import { use } from 'react';

interface LedgerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LedgerDetailPage({ params }: LedgerDetailPageProps) {
  const { id } = use(params);
  return <LedgerDetailScreen ledgerId={id} />;
}
