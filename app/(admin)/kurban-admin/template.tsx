"use client"

import { ClientLayout } from './client-layout';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="p-6">
        {children}
      </div>
    </ClientLayout>
  );
} 