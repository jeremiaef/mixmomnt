import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  // TODO: Fetch from Convex — displayName, tagline, avatarUrl, projectCount
  const displayName = username;
  const tagline = 'vibecoder';
  const projectCount = 0;
  const avatarUrl = null;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0d0d0f', padding: '48px', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top: avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1a1a22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, color: '#f0ede8' }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#f0ede8' }}>{displayName}</span>
            <span style={{ fontSize: '20px', color: '#8a8aaa' }}>@{username}</span>
            {tagline && <span style={{ fontSize: '18px', color: '#c0bdb8' }}>{tagline}</span>}
          </div>
        </div>
        {/* Bottom: stats + brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ background: '#141418', border: '1px solid #222230', borderRadius: '999px', padding: '8px 20px', fontSize: '16px', color: '#8a8aaa' }}>
            {(projectCount as number)} project{(projectCount as number) !== 1 ? 's' : ''}
          </div>
          <span style={{ fontSize: '16px', color: '#5a5a6a' }}>built with ✦ mixmomnt</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}