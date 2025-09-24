import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request){
  const { to, subject, html } = await req.json();
  const key = process.env.RESEND_API_KEY;
  if(!key) return NextResponse.json({ ok:false, error: 'RESEND_API_KEY missing' }, { status: 200 });
  const resend = new Resend(key);
  await resend.emails.send({ from: process.env.EMAIL_FROM || 'no-reply@example.com', to, subject, html });
  return NextResponse.json({ ok:true });
}