import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const votes = await prisma.vote.findMany({
            select: { number: true },
        });

        const counts: Record<string, number> = {};
        votes.forEach((v) => {
            const n = v.number.toString();
            counts[n] = (counts[n] || 0) + 1;
        });

        const results = Object.entries(counts).map(([num, count]) => ({
            number: parseInt(num),
            count,
        }));

        // Sort by count desc, then number asc (tie-break)
        results.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.number - b.number;
        });

        const top3 = results.slice(0, 3);

        return NextResponse.json({
            counts,
            top3,
            totalVotes: votes.length,
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
