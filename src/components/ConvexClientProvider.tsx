'use client';

import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs';
import convex from '@/lib/convex';

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!convex) return <>{children}</>;
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
