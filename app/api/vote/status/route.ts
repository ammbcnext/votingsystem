import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const fp = searchParams.get('fp');

    if (!fp) {
        return NextResponse.json({ error: 'Missing fp' }, { status: 400 });
    }

    try {
        const vote = await prisma.vote.findUnique({
            where: { fingerprint: fp },
        });

        return NextResponse.json({ hasVoted: !!vote });
    } catch (error) {
        console.error('Error checking vote status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
