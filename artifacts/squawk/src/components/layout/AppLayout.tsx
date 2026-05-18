import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import SquawkBot from '@/components/SquawkBot';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative scroll-smooth bg-background text-foreground">
        {children}
      </main>
      <BottomNav />
      <SquawkBot />
    </div>
  );
}
