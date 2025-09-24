import Stripe from 'stripe';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { priceId, successUrl, cancelUrl } = await request.json();
  const secret = process.env.STRIPE_SECRET_KEY;
  if(!secret) return NextResponse.json({ error: 'STRIPE_SECRET_KEY missing' }, { status: 200 });
  const stripe = new Stripe(secret, { apiVersion: '2024-06-20' as any });
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId || process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: successUrl || (process.env.NEXT_PUBLIC_SITE_URL + '/booking?paid=1'),
    cancel_url: cancelUrl || (process.env.NEXT_PUBLIC_SITE_URL + '/booking?canceled=1')
  });
  return NextResponse.json({ id: session.id, url: session.url });
}