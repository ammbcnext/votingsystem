import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const votes = await prisma.vote.findMany({
            orderBy: { createdAt: 'asc' },
            select: { number: true },
        });

        const numbers = votes.map((v) => v.number);
        return NextResponse.json({ votes: numbers });
    } catch (error) {
        console.error('Error fetching votes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
