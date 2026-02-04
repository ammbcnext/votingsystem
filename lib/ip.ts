import { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get('x-forwarded-for');

    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // Fallback to connection remote address not directly available in NextRequest easily 
    // without digging into deeper text/dummy/localhost if needed.
    // In Next.js middleware or generic request, x-forwarded-for is standard.
    // For local development it might be null, so we return 'unknown' or '127.0.0.1' 
    // but requirements said "unknown" is fine fallback.
    return 'unknown';
}
