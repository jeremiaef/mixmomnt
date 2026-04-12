import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; repo: string }> }
) {
  const { username, repo } = await params;
  // TODO: Fetch from Convex
  const description = 'A project on mixmomnt';
  const language = 'Code';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0d0d0f', padding: '48px', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top: project name + description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>📦</span>
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#f0ede8' }}>{repo}</span>
          </div>
          <p style={{ fontSize: '18px', color: '#c0bdb8', lineHeight: 1.5 }}>{description}</p>
          <span style={{ background: '#1a1a22', border: '1px solid #222230', borderRadius: '999px', padding: '4px 16px', fontSize: '14px', color: '#8a8aaa', alignSelf: 'flex-start' }}>{language}</span>
        </div>
        {/* Bottom: publisher + brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '16px', color: '#c0bdb8' }}>by @{username}</span>
          <span style={{ fontSize: '16px', color: '#5a5a6a' }}>built with ✦ mixmomnt</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}