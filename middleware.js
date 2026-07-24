import { NextResponse } from 'next/server'; // ou l'équivalent selon votre framework web

const ALLOWED_IPS = ['123.45.67.89', '98.76.54.32'];

export function middleware(request) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!ALLOWED_IPS.includes(ip)) {
        return new NextResponse('Accès refusé', { status: 403 });
    }

    return NextResponse.next();
}
