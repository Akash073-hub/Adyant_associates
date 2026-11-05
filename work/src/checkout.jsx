import { useEffect, useState } from 'react';
import './checkout.css';
import SiteNav from './site-nav';
import { apiRequest } from './api';

const paymentMethods = [
  ['upi', '▦', 'Instant UPI / QR', 'RECOMMENDED'],
  ['card', '▣', 'Card Payment', 'VISA / MC / AMEX'],
  ['bank', '▤', 'Net Banking', 'DIRECT WIRE'],
  ['po', '▥', 'Corporate PO', 'TAX INVOICE'],
];

function Checkout() {
  const [method, setMethod] = useState('upi');
  const [seconds, setSeconds] = useState(11 * 60 + 14);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText('adyantassociates.admissions@icici');
    } catch (error) {
      // Clipboard access can be unavailable in preview environments.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <div className="checkout-page">
    <SiteNav active="mock" coursesHref="/membership#curriculum" mockHref="/mock-interview" ctaHref="/checkout" />
    <div className="checkout-subbar"><div><span>Programs</span><i>/</i><span>Book your mock interview</span><i>/</i><b>Secure booking</b></div><strong><i /> Your booking is reserved for <em>{countdown}</em> mins</strong></div>
    <main className="checkout-main"><div className="checkout-title"><span>BOOKING PROTOCOL // LIVE MOCK INTERVIEW</span><h1>Book Your Live Mock Interview</h1><p>Reserve a live mock interview, answer realistic questions, and receive direct feedback to improve your interview performance.</p></div><div className="checkout-grid"><PaymentPanel method={method} setMethod={setMethod} copied={copied} copyUpi={copyUpi} /><OrderSummary method={method} /></div></main>
    <footer className="checkout-footer"><div><b>Adyant Associates</b><span>|</span><p>© 2026 Adyant Associates. QA leadership and interview preparation support.</p></div><nav><a href="/membership#curriculum">Programs</a><a href="/membership#classroom-preview">Preview</a><a href="/membership#faq">FAQs</a><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></nav></footer>
  </div>;
}

function PaymentPanel({ method, setMethod, copied, copyUpi }) {
  return <section className="payment-column"><div className="payment-card"><div className="payment-heading"><div><span>MODULE 01 // PAYMENT GATEWAY</span><h2>Select Payment Method</h2></div><b>✓ PCI-DSS Tier 1</b></div><div className="payment-tabs">{paymentMethods.map(([id, icon, title, note]) => <button className={method === id ? 'selected' : ''} key={id} onClick={() => setMethod(id)} type="button"><strong>{icon}</strong><span>{title}</span><small>{note}</small></button>)}</div>{method === 'upi' ? <UpiPanel copied={copied} copyUpi={copyUpi} /> : <div className="alternative-method"><strong>{paymentMethods.find(([id]) => id === method)[2]}</strong><p>Continue with this secure institutional payment channel. Your seat remains reserved while payment authorization is completed.</p><button type="button">Continue Securely →</button></div>}<div className="supported"><span>SUPPORTED INSTITUTIONAL CHANNELS</span><div><b>HDFC</b><b>ICICI</b><b>CHASE</b><b>CITI</b></div><aside>▣ <span><strong>Employer Sponsorship or L&amp;D Reimbursement?</strong><small>An automated GST/VAT compliant tax receipt will be issued immediately upon payment clearance.</small></span></aside></div></div><div className="share-grid"><button type="button">✉ <span><strong>Share this to Email</strong><small>Send proforma invoice &amp; link to finance</small></span></button><button type="button">◉ <span><strong>Share this to WhatsApp</strong><small>Instant checkout link &amp; batch specs</small></span></button></div></section>;
}

function UpiPanel({ copied, copyUpi }) {
  return <div className="upi-panel"><div className="qr-box"><QrCode /><span>QR CODE VALID FOR BATCH #21</span></div><div className="upi-details"><h3>Scan using your mobile device</h3><p>Scan using GPay, PhonePe, Paytm, BHIM, or any international UPI-compliant app for instant seat authorization.</p><label>MANUAL VIRTUAL PAYMENT ADDRESS (VPA)</label><div className="vpa"><input readOnly value="adyantassociates.admissions@icici" aria-label="UPI payment address" /><button onClick={copyUpi} type="button">{copied ? 'Copied!' : 'Copy'}</button></div><div className="polling"><span>◌ Waiting for transfer detection...</span><small>Auto-refresh 5s</small></div></div></div>;
}

function QrCode() { return <div className="qr-code"><i /><i /><i /><span>AA</span><b /><b /><b /><b /><b /><b /><b /><b /></div>; }
function OrderSummary({ method }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => window.localStorage.getItem('adyant_member_email') || window.localStorage.getItem('adyant_student_email') || '');
  const [preferredTime, setPreferredTime] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [bookingError, setBookingError] = useState('');

  async function applyPromo() {
    const code = promoCode.trim().toUpperCase();
    setPromoMessage('');
    setPromoError('');
    setAppliedPromo(null);
    if (!code) {
      setPromoError('Enter a booking code first.');
      return;
    }
    try {
      const result = await apiRequest('/bookings/validate-promo', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setPromoCode(result.code);
      setAppliedPromo(result);
      setPromoMessage(`${result.code} applied — ${result.discount_percent}% off your quoted booking fee.`);
    } catch (requestError) {
      setPromoError(requestError.message);
    }
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (promoCode.trim() && !appliedPromo) {
      setBookingError('Apply the booking code before confirming, or clear it to continue without a code.');
      return;
    }
    setSubmitting(true);
    setBookingError('');
    setBooking(null);
    try {
      const result = await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          preferred_time: preferredTime,
          payment_method: method,
          promo_code: appliedPromo?.code || '',
        }),
      });
      setBooking(result);
      window.localStorage.setItem('adyant_student_email', email.trim().toLowerCase());
    } catch (requestError) {
      setBookingError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return <section className="summary-column"><form className="summary-card checkout-booking-form" onSubmit={submitBooking}>
    <span className="summary-label">01 // BOOKING SELECTION</span><h2>Ready Mock Preparation</h2><b className="summary-badge">LIVE MOCK INTERVIEW // 1:1</b>
    <div className="summary-meta"><Meta label="SESSION FORMAT" value="Focused mock interview" detail="Realistic questions with direct feedback" /><Meta label="INTERVIEW COACH" value="Senior QA interviewer" detail="Practical preparation and next steps" /></div>
    <div className="deliverables"><span>MOCK SESSION INCLUDES:</span>{['Realistic interview questions', 'Structured answer feedback', 'Confidence and clarity review', 'Personalized improvement plan', 'Booking confirmation and follow-up notes'].map((item) => <p key={item}>✓ {item}</p>)}</div>
    <fieldset className="booking-contact"><legend>YOUR SESSION DETAILS</legend><label htmlFor="booking-name">Your name</label><input id="booking-name" name="name" autoComplete="name" maxLength="120" value={name} onChange={(event) => setName(event.target.value)} required /><label htmlFor="booking-email">Email for booking updates</label><input id="booking-email" name="email" type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} required /><label htmlFor="booking-time">Preferred date and time</label><input id="booking-time" name="preferred_time" type="datetime-local" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} required /></fieldset>
    <div className="promo"><label htmlFor="booking-code">ENTER BOOKING CODE</label><div><input id="booking-code" placeholder="Try MOCK10 or FIRSTMOCK15" aria-label="Booking code" value={promoCode} onChange={(event) => { setPromoCode(event.target.value); setAppliedPromo(null); setPromoMessage(''); setPromoError(''); }} /><button onClick={applyPromo} type="button">Apply</button></div>{promoMessage && <p className="checkout-feedback success" role="status">{promoMessage}</p>}{promoError && <p className="checkout-feedback error" role="alert">{promoError}</p>}</div>
    <div className="pricing"><p><span>Mock interview session</span><strong>Booking fee</strong></p>{appliedPromo && <p className="applied-discount"><span>Booking code ({appliedPromo.code})</span><strong>{appliedPromo.discount_percent}% off</strong></p>}<p><span>Preparation materials</span><small>INCLUDED</small></p><div className="net"><span><strong>Secure your session</strong><small>Payment is not collected on this page</small></span><strong>Ready<small>TO BOOK</small></strong></div>
      {booking && <div className="booking-result" role="status"><strong>Booking request saved</strong><span>Reference: {booking.booking.id}</span><span>Status: Pending payment. The team will follow up about your preferred time.</span>{!booking.email_sent && <span>{booking.notification_message} Please contact support with your booking reference.</span>}</div>}
      {bookingError && <p className="checkout-feedback error" role="alert">{bookingError}</p>}
      <button className="confirm" disabled={submitting} type="submit">▣ {submitting ? 'SAVING BOOKING…' : booking ? 'CREATE ANOTHER BOOKING' : 'CONFIRM MOCK INTERVIEW'}</button>
    </div>
  </form><div className="guarantee">✓ <span><strong>Practical feedback guarantee</strong><small>Leave your mock session with clear feedback and next steps for improvement.</small></span></div></section>;
}
function Meta({ label, value, detail }) { return <div><span>▣ {label}</span><strong>{value}</strong><small>{detail}</small></div>; }

export default Checkout;
