'use client';

import { ConvexProvider } from 'convex/react';
import convex from '@/lib/convex';

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't render ConvexProvider during build (convex is undefined without env vars)
  if (!convex) return <>{children}</>;
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
