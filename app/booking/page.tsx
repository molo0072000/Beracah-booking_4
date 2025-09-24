'use client';
import { useEffect, useMemo, useState } from 'react';

const fmt = (n:number, c:string='€') => c + ' ' + (Number(n)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const estimate = (service:string, km:number, pax:number, lug:string, night:boolean, cur:string) => {
  let base=0, perKm=0;
  if(service==='Airport Shuttle'){ base=15; perKm=1.8; }
  else if(service==='Courier'){ base=10; perKm=2.0; }
  else { base=25; perKm=1.6; }
  let price = base + (km||0)*perKm + Math.max(0,(pax||1)-1)*5;
  if(lug==='2') price += 4; else if(lug==='3+') price += 8;
  if(night) price *= 1.15;
  return price;
};

export default function BookingPage(){
  const [svc,setSvc] = useState('Airport Shuttle');
  const [km,setKm] = useState<number>(20);
  const [pax,setPax] = useState<number>(1);
  const [lug,setLug] = useState<string>('0');
  const [night,setNight] = useState<'0'|'1'>('0');
  const [cur,setCur] = useState('€');
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [phone,setPhone]=useState('');
  const [from,setFrom]=useState('');
  const [to,setTo]=useState('');
  const [date,setDate]=useState<string>('');
  const [time,setTime]=useState<string>('');
  const [bPax,setBPax]=useState<number>(1);
  const [bLug,setBLug]=useState<string>('0');
  const [notes,setNotes]=useState('');
  const [mbx,setMbx]=useState<string>(process.env.NEXT_PUBLIC_MAPBOX_TOKEN||'');
  const [msg,setMsg]=useState<string>('');

  useEffect(()=>{const t=new Date();setDate(t.toISOString().slice(0,10));setTime(new Date(t.getTime()+3600000).toISOString().slice(11,16));},[]);

  const price = useMemo(()=>estimate(svc, km, pax, lug, night==='1', cur), [svc,km,pax,lug,night,cur]);
  const priceText = useMemo(()=>fmt(price, cur), [price, cur]);

  async function geocode(addr:string, token:string){
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${token}&limit=1`;
    const r = await fetch(url); if(!r.ok) throw new Error('geocode failed');
    const j = await r.json(); if(!j.features?.length) throw new Error('address not found');
    return j.features[0].center as [number, number];
  }
  async function route(a:[number,number], b:[number,number], token:string){
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${a[0]},${a[1]};${b[0]},${b[1]}?access_token=${token}&overview=false`;
    const r = await fetch(url); if(!r.ok) throw new Error('route failed');
    const j = await r.json(); if(!j.routes?.length) throw new Error('no route');
    return j.routes[0].distance/1000 as number;
  }
  async function calcDistance(){
    if(!mbx){ setMsg('Please set your Mapbox public token first.'); return; }
    if(!from || !to){ setMsg('Enter both pickup and dropoff addresses.'); return; }
    setMsg('Calculating distance…');
    try{
      const A = await geocode(from, mbx);
      const B = await geocode(to, mbx);
      const d = await route(A, B, mbx);
      setKm(Number(d.toFixed(1)));
      setMsg(`Distance set from addresses: ${d.toFixed(1)} km`);
    }catch(e:any){ console.error(e); setMsg('Could not calculate distance. Check addresses/token.'); }
  }

  async function submitBooking(payNow:boolean){
    if(!name || !email || !phone || !from || !to || !date || !time){ alert('Please fill in all required fields.'); return; }
    const nightFlag = (parseInt(time.slice(0,2))>=22 || parseInt(time.slice(0,2))<6);
    const finalPrice = estimate(svc, km, bPax, bLug, nightFlag, cur);
    const payload = { name,email,phone, service:svc, from, to, date, time, pax:bPax, lug:bLug, notes, price:fmt(finalPrice,cur), cur };

    fetch('/api/bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}).catch(()=>{});
    fetch('/api/email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to: email, subject: 'Beracah Booking Confirmation', html: `<p>Thank you, ${name}. We received your booking.</p><p>${payload.service}: ${payload.from} → ${payload.to}, ${payload.date} ${payload.time}</p><p>Estimated price: ${payload.price}</p>` }) }).catch(()=>{});
    fetch('/api/calendar', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title:`${payload.service} — ${name}`, start:`${payload.date}T${payload.time}:00`, location:`${payload.from} → ${payload.to}`, description:`Pax ${payload.pax}, Luggage ${payload.lug}. Notes: ${payload.notes}` }) }).catch(()=>{});

    if(payNow){
      const ckRes = await fetch('/api/stripe/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ priceId: process.env.STRIPE_PRICE_ID, successUrl: window.location.origin + '/booking?paid=1', cancelUrl: window.location.href }) });
      const ck = await ckRes.json().catch(()=>null);
      if(ckRes.ok && ck?.url){ window.location.href = ck.url; return; }
      alert('Payment init failed (keys missing or not configured). The booking was still submitted.');
    }else{
      alert('Booking submitted. A confirmation email will follow shortly.');
    }
  }

  return (
    <main className="container" style={{marginTop:16}}>
      <section className="card">
        <div className="h2" style={{fontSize:22,fontWeight:800,marginBottom:8}}>Instant Price Estimate</div>
        <div className="row3">
          <div><label>Service</label>
            <select value={svc} onChange={e=>setSvc(e.target.value)}>
              <option>Airport Shuttle</option>
              <option>Courier</option>
              <option>Vehicle Transfer</option>
            </select>
          </div>
          <div><label>Distance (km)</label><input type="number" step="0.1" value={km} onChange={e=>setKm(parseFloat(e.target.value)||0)} /></div>
          <div><label>Passengers</label><input type="number" min={1} value={pax} onChange={e=>setPax(parseInt(e.target.value)||1)} /></div>
        </div>
        <div className="row3">
          <div><label>Large Luggage</label><select value={lug} onChange={e=>setLug(e.target.value)}><option value="0">0</option><option>1</option><option>2</option><option>3+</option></select></div>
          <div><label>Night (22:00–06:00)</label><select value={night} onChange={e=>setNight(e.target.value as any)}><option value="0">No</option><option value="1">Yes</option></select></div>
          <div><label>Currency</label><select value={cur} onChange={e=>setCur(e.target.value)}><option value="€">EUR (€)</option><option value="£">GBP (£)</option><option value="$">USD ($)</option><option value="₦">NGN (₦)</option></select></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginTop:8}}><span>Estimated Price:</span><span className="price">{priceText}</span></div>
        <div className="muted">Paste your Mapbox token below to auto-calc distance from addresses.</div>
        <div className="row">
          <div><label>Mapbox Access Token</label><input value={mbx} onChange={e=>setMbx(e.target.value)} placeholder="pk.eyJ... (your public token)"/></div>
          <div style={{display:'flex',alignItems:'end'}}><button className="btn" onClick={calcDistance}>Calculate Distance from Addresses</button></div>
        </div>
        <div className="muted">{msg}</div>
      </section>

      <section className="card">
        <div className="h2" style={{fontSize:22,fontWeight:800,marginBottom:8}}>Booking</div>
        <div className="row">
          <div><label>Full Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div>
          <div><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
        </div>
        <div className="row">
          <div><label>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+49 ..."/></div>
          <div><label>Service</label>
            <select value={svc} onChange={e=>setSvc(e.target.value)}>
              <option>Airport Shuttle</option>
              <option>Courier</option>
              <option>Vehicle Transfer</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div><label>Pickup Address</label><input value={from} onChange={e=>setFrom(e.target.value)} placeholder="Street, No., City"/></div>
          <div><label>Dropoff Address</label><input value={to} onChange={e=>setTo(e.target.value)} placeholder="Street, No., City"/></div>
        </div>
        <div className="row3">
          <div><label>Date</label><input value={date} onChange={e=>setDate(e.target.value)} type="date"/></div>
          <div><label>Time</label><input value={time} onChange={e=>setTime(e.target.value)} type="time"/></div>
          <div><label>Passengers</label><input value={bPax} onChange={e=>setBPax(parseInt(e.target.value)||1)} type="number" min={1}/></div>
        </div>
        <div className="row3">
          <div><label>Large Luggage</label><select value={bLug} onChange={e=>setBLug(e.target.value)}><option value="0">0</option><option>1</option><option>2</option><option>3+</option></select></div>
          <div><label>Notes</label><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Flight number, special requests..."/></div>
          <div><label>Currency</label><select value={cur} onChange={e=>setCur(e.target.value)}><option value="€">EUR (€)</option><option value="£">GBP (£)</option><option value="$">USD ($)</option><option value="₦">NGN (₦)</option></select></div>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
          <button className="btn" onClick={()=>submitBooking(false)}>Submit Booking</button>
          <button className="btn primary" onClick={()=>submitBooking(true)}>Submit + Pay Now</button>
        </div>
      </section>
    </main>
  );
}
