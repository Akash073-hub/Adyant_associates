import { useEffect, useState } from 'react';
import './checkout.css';

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
  const [confirmed, setConfirmed] = useState(false);

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
    <header className="checkout-header"><div className="checkout-header-inner"><a className="checkout-brand" href="/"><span /> Adyant Associates</a><nav><a href="/">Home</a><a className="active" href="/membership#curriculum">Curriculum</a><a href="/membership#cohorts">Cohorts</a><a href="/membership">Membership</a><a href="/membership#pedagogy">Pedagogy</a><a href="/#sandboxes">Practice Sandboxes</a></nav><div className="checkout-user"><span>▣ SSL 256-BIT SECURE</span><b>ME</b><strong>member@adyantassociates.com<small>ID: #AA-99824</small></strong></div></div></header>
    <div className="checkout-subbar"><div><span>Curriculum</span><i>/</i><span>Complete SDET: Selenium 4, Java 21</span><i>/</i><b>Enrollment Checkout</b></div><strong><i /> Seat reserved for <em>{countdown}</em> mins // Batch SDET-JAVA-21</strong></div>
    <main className="checkout-main"><div className="checkout-title"><span>CHECKOUT PROTOCOL // INGESTION &amp; ACCREDITATION</span><h1>Complete Your Cohort Enrollment</h1><p>Finalize your credential assignment for the upcoming engineering batch. Review enterprise verification standards, access credentials, and initiate cryptographic tuition processing below.</p></div><div className="checkout-grid"><PaymentPanel method={method} setMethod={setMethod} copied={copied} copyUpi={copyUpi} /><OrderSummary confirmed={confirmed} setConfirmed={setConfirmed} /></div></main>
    <footer className="checkout-footer"><div><b>Adyant Associates</b><span>|</span><p>© 2025 Adyant Associates. Enterprise SDET &amp; Quality Engineering Institute. All rights reserved.</p></div><nav><a href="/membership#curriculum">Curriculum Matrix</a><a href="/membership#cohorts">Live Batches</a><a href="/membership">Enterprise Training</a><a href="/#sandboxes">Sandboxes</a><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></nav></footer>
  </div>;
}

function PaymentPanel({ method, setMethod, copied, copyUpi }) {
  return <section className="payment-column"><div className="payment-card"><div className="payment-heading"><div><span>MODULE 01 // PAYMENT GATEWAY</span><h2>Select Payment Method</h2></div><b>✓ PCI-DSS Tier 1</b></div><div className="payment-tabs">{paymentMethods.map(([id, icon, title, note]) => <button className={method === id ? 'selected' : ''} key={id} onClick={() => setMethod(id)} type="button"><strong>{icon}</strong><span>{title}</span><small>{note}</small></button>)}</div>{method === 'upi' ? <UpiPanel copied={copied} copyUpi={copyUpi} /> : <div className="alternative-method"><strong>{paymentMethods.find(([id]) => id === method)[2]}</strong><p>Continue with this secure institutional payment channel. Your seat remains reserved while payment authorization is completed.</p><button type="button">Continue Securely →</button></div>}<div className="supported"><span>SUPPORTED INSTITUTIONAL CHANNELS</span><div><b>HDFC</b><b>ICICI</b><b>CHASE</b><b>CITI</b></div><aside>▣ <span><strong>Employer Sponsorship or L&amp;D Reimbursement?</strong><small>An automated GST/VAT compliant tax receipt will be issued immediately upon payment clearance.</small></span></aside></div></div><div className="share-grid"><button type="button">✉ <span><strong>Share this to Email</strong><small>Send proforma invoice &amp; link to finance</small></span></button><button type="button">◉ <span><strong>Share this to WhatsApp</strong><small>Instant checkout link &amp; batch specs</small></span></button></div></section>;
}

function UpiPanel({ copied, copyUpi }) {
  return <div className="upi-panel"><div className="qr-box"><QrCode /><span>QR CODE VALID FOR BATCH #21</span></div><div className="upi-details"><h3>Scan using your mobile device</h3><p>Scan using GPay, PhonePe, Paytm, BHIM, or any international UPI-compliant app for instant seat authorization.</p><label>MANUAL VIRTUAL PAYMENT ADDRESS (VPA)</label><div className="vpa"><input readOnly value="adyantassociates.admissions@icici" aria-label="UPI payment address" /><button onClick={copyUpi} type="button">{copied ? 'Copied!' : 'Copy'}</button></div><div className="polling"><span>◌ Waiting for transfer detection...</span><small>Auto-refresh 5s</small></div></div></div>;
}

function QrCode() { return <div className="qr-code"><i /><i /><i /><span>AA</span><b /><b /><b /><b /><b /><b /><b /><b /></div>; }
function OrderSummary({ confirmed, setConfirmed }) { return <section className="summary-column"><div className="summary-card"><span className="summary-label">01 // CURRICULUM SELECTION</span><h2>Complete SDET: Selenium 4, Java 21 &amp; Grid Architecture</h2><b className="summary-badge">FLAGSHIP COHORT // WINTER 2026</b><div className="summary-meta"><Meta label="BATCH DURATION & SCHEDULE" value="Nov 04, 2026 - Jan 15, 2027" detail="Mon-Thu, 8:00 PM - 9:30 PM IST / 10:30 AM - 12:00 PM EST" /><Meta label="LEAD FACULTY" value="Arun Kumar" detail="Principal SDET (Ex-Staff SDET at FinTech)" /></div><div className="deliverables"><span>COHORT SPECIFICATIONS INCLUDED:</span>{['80 Hours Live High-Rigour Instruction', 'Dedicated Docker Grid Sandbox Repository', 'Weekly 1-on-1 Architectural PR Code Reviews', 'Verified Cryptographic SDET Certificate', 'Corporate Tax Reimbursement Receipt'].map((item) => <p key={item}>✓ {item}</p>)}</div><div className="promo"><label>ENTER INSTITUTIONAL VOUCHER / PROMO</label><div><input value="FELLOWSHIP2026" readOnly /><button type="button">Applied</button></div></div><div className="pricing"><p><span>Standard Cohort Tuition</span><del>$1,199.00</del></p><p className="discount"><span>Early Bird Fellowship Grant <b>50% OFF</b></span><strong>-$600.00</strong></p><p><span>Docker TestLab Compute Allocation</span><small>INCLUDED (FREE)</small></p><div className="net"><span><strong>Net Payable Tuition</strong><small>or 3 monthly installments of $210/mo</small></span><strong>$599.00<small>USD // TAX INCLUDED</small></strong></div><button className="confirm" onClick={() => setConfirmed(true)} type="button">▣ {confirmed ? 'ENROLLMENT AUTHORIZED' : 'CONFIRM & AUTHORIZE ENROLLMENT'}</button></div></div><div className="guarantee">✓ <span><strong>100% Risk-Free Academic Guarantee</strong><small>Evaluate our pedagogical rigor firsthand. After Batch Lecture 1, request a full 100% refund with zero administrative deductions.</small></span></div></section>; }
function Meta({ label, value, detail }) { return <div><span>▣ {label}</span><strong>{value}</strong><small>{detail}</small></div>; }

export default Checkout;
