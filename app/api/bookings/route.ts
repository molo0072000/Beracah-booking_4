import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request){
  const data = await req.json();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE!;
  if(!url || !key) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 200 });
  const supabase = createClient(url, key);
  const { error } = await supabase.from('bookings').insert({
    name: data.name, email: data.email, phone: data.phone, service: data.service,
    from_addr: data.from, to_addr: data.to, date: data.date, time: data.time,
    pax: data.pax, luggage: data.lug, notes: data.notes, price: data.price, currency: data.cur
  });
  if (error) return NextResponse.json({ ok:false, error }, { status: 200 });
  return NextResponse.json({ ok:true });
}