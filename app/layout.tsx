import './globals.css';
import Image from 'next/image';

export const metadata = {
  title: 'Beracah Mobility GmbH — Booking',
  description: 'Airport Shuttle • Courier Services • Vehicle Transfers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav hidePrint">
          <div className="wrap container">
            <div className="brand">
              <Image src="/logo.png" alt="Logo" width={42} height={42} style={{borderRadius:10, border:'1px solid #e5e7eb'}}/>
              <div>
                <div className="t1">Beracah Mobility GmbH</div>
                <div className="t2">Airport Shuttle • Courier Services • Vehicle Transfers</div>
              </div>
            </div>
            <div className="actions">
              <a href="/booking" className="btn">Book Now</a>
            </div>
          </div>
        </nav>
        {children}
        <footer className="footer">
          <div><strong>Beracah Mobility GmbH</strong> — Zoetermeerstraße 38, 59075 Hamm · +49 176 93111790 · info@beracah-mobility.de · www.beracah-mobility.de</div>
          <div>HRB: 10408 Hamm District Court · Managing Director: Imoleayo Adeyemo · Company headquarters: Hamm · Tax number: 322/5701/1929 · VAT ID no.: DE344821065</div>
        </footer>
      </body>
    </html>
  );
}
