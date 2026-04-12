import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'mixmomnt — where vibecoders ship',
  description:
    'Every builder gets a portfolio at username.mixmomnt.com, built from what you\'ve shipped. No code required.',
  openGraph: {
    title: 'mixmomnt — where vibecoders ship',
    description:
      'Every builder gets a portfolio at username.mixmomnt.com, built from what you\'ve shipped. No code required.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}