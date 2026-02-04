import prisma from '@/lib/prisma';
import { getClientIp } from '@/lib/ip';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const voteSchema = z.object({
    number: z.number().int().min(0).max(100),
    fp: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = voteSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR' }, { status: 400 });
        }

        const { number, fp } = result.data;
        const ip = getClientIp(req);
        const userAgent = req.headers.get('user-agent') || undefined;

        // Check if already voted (redundant but safe) or handle unique constraint error
        try {
            await prisma.vote.create({
                data: {
                    number,
                    fingerprint: fp,
                    ip,
                    userAgent,
                },
            });
            return NextResponse.json({ ok: true }, { status: 201 });
        } catch (e: any) {
            if (e.code === 'P2002') {
                return NextResponse.json({ ok: false, error: 'ALREADY_VOTED' }, { status: 409 });
            }
            throw e;
        }

    } catch (error) {
        console.error('Vote submission error:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
