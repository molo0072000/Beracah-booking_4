import Stripe from 'stripe';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const sig = (req.headers.get('stripe-signature') as string) || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if(!secret || !key) return new NextResponse('Missing webhook secrets', { status: 200 });
  const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  const buf = Buffer.from(await req.arrayBuffer());
  try {
    const event = stripe.webhooks.constructEvent(buf, sig, secret);
    if (event.type === 'checkout.session.completed') {
      console.log('Payment completed');
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 200 });
  }
}