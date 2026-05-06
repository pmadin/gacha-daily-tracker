import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const REGISTRATION_TOKEN = process.env.REGISTRATION_TOKEN ?? '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Register — inject the token server-side so it's never in the client bundle
    const registerRes = await fetch(`${API_URL}/gdt/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, registrationToken: REGISTRATION_TOKEN }),
    });

    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      return NextResponse.json(registerData, { status: registerRes.status });
    }

    // 2. Auto-login to get JWT (register endpoint doesn't return a token)
    const loginRes = await fetch(`${API_URL}/gdt/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      return NextResponse.json({ error: 'Account created but login failed. Please sign in manually.' }, { status: 500 });
    }

    return NextResponse.json({ token: loginData.token, user: loginData.user });
  } catch {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
