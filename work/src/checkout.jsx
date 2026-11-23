import { useEffect, useState } from 'react';
import './checkout.css';
import SiteNav from './site-nav';
import { apiRequest } from './api';

const paymentMethods = [
  ['upi', '▦', 'Instant UPI / QR', 'RECOMMENDED'],
  ['card', '▣', 'Card Payment', 'VISA / MC / RUPAY'],
  ['bank', '▤', 'Net Banking', 'ALL INDIAN BANKS'],
  ['po', '▥', 'Corporate PO', 'TAX INVOICE'],
];

const FALLBACK_PLANS = [
  {
    id: 'ready-mock-preparation',
    title: 'Ready Mock Preparation',
    badge: 'LIVE MOCK INTERVIEW // 1:1',
    format: 'Focused 1:1 mock interview',
    coach: 'Senior QA interviewer',
    amount_inr: 1999,
    currency: 'INR',
    requires_preferred_time: true,
  },
  {
    id: 'ai-for-qa-managers',
    title: 'AI for QA Managers',
    badge: 'LEADERSHIP PROGRAM // SELF-PACED + COHORT',
    format: 'GenAI, AI Agents, MCP & n8n',
    coach: 'Adyant Associates QA Faculty',
    amount_inr: 4999,
    currency: 'INR',
    requires_preferred_time: false,
  },
  {
    id: 'interview-preparation-guide',
    title: 'Interview Preparation Guide',
    badge: 'CAREER PREP // FRAMEWORKS & PLAYBOOKS',
    format: 'Self-paced interview prep',
    coach: 'Senior QA Leadership Mentors',
    amount_inr: 2499,
    currency: 'INR',
    requires_preferred_time: false,
  },
];

function loadRazorpayScript() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatInr(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function Checkout() {
  const [method, setMethod] = useState('upi');
  const [seconds, setSeconds] = useState(11 * 60 + 14);
  const [copied, setCopied] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({
    configured: false,
    key_id: '',
    currency: 'INR',
    plans: FALLBACK_PLANS,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    apiRequest('/payments/config')
      .then((result) => {
        setPaymentConfig({
          configured: Boolean(result.configured),
          key_id: result.key_id || '',
          currency: result.currency || 'INR',
          plans: result.plans?.length ? result.plans : FALLBACK_PLANS,
        });
      })
      .catch(() => {});
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
    <div className="checkout-subbar"><div><span>Programs</span><i>/</i><span>Enrollment &amp; Mock Interview</span><i>/</i><b>Razorpay Secure Checkout</b></div><strong><i /> Your seat is reserved for <em>{countdown}</em> mins</strong></div>
    <main className="checkout-main">
      <div className="checkout-title">
        <span>PAYMENT PROTOCOL // RAZORPAY SECURE CHECKOUT</span>
        <h1>Complete Your Enrollment</h1>
        <p>Select your program or mock interview, apply any promo code, and pay securely via Razorpay using UPI, cards, or net banking.</p>
      </div>
      <div className="checkout-grid">
        <PaymentPanel method={method} setMethod={setMethod} copied={copied} copyUpi={copyUpi} razorpayReady={paymentConfig.configured} />
        <OrderSummary method={method} paymentConfig={paymentConfig} />
      </div>
    </main>
    <footer className="checkout-footer"><div><b>Adyant Associates</b><span>|</span><p>© 2026 Adyant Associates. QA leadership and interview preparation support.</p></div><nav><a href="/membership#curriculum">Programs</a><a href="/membership#classroom-preview">Preview</a><a href="/membership#faq">FAQs</a><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></nav></footer>
  </div>;
}

function PaymentPanel({ method, setMethod, copied, copyUpi, razorpayReady }) {
  return <section className="payment-column">
    <div className="payment-card">
      <div className="payment-heading">
        <div>
          <span>MODULE 01 // RAZORPAY GATEWAY</span>
          <h2>Select Payment Method</h2>
        </div>
        <b className={razorpayReady ? 'rzp-badge ready' : 'rzp-badge pending'}>
          {razorpayReady ? '✓ Razorpay Connected' : '◌ Razorpay Keys Pending'}
        </b>
      </div>
      <div className="payment-tabs">
        {paymentMethods.map(([id, icon, title, note]) => (
          <button className={method === id ? 'selected' : ''} key={id} onClick={() => setMethod(id)} type="button">
            <strong>{icon}</strong>
            <span>{title}</span>
            <small>{note}</small>
          </button>
        ))}
      </div>
      {method === 'upi' ? (
        <UpiPanel copied={copied} copyUpi={copyUpi} razorpayReady={razorpayReady} />
      ) : (
        <div className="alternative-method">
          <strong>{paymentMethods.find(([id]) => id === method)[2]} via Razorpay</strong>
          <p>
            {method === 'po'
              ? 'Save your booking on the right and our team will issue a GST-compliant corporate proforma invoice.'
              : 'Complete your details on the right and click Pay with Razorpay to authorize securely via Razorpay Checkout.'}
          </p>
        </div>
      )}
      <div className="supported">
        <span>POWERED BY RAZORPAY · SUPPORTED CHANNELS</span>
        <div><b>UPI</b><b>VISA</b><b>MASTERCARD</b><b>RUPAY</b><b>NETBANKING</b></div>
        <aside>▣ <span><strong>Instant Member Activation &amp; Receipt</strong><small>Once Razorpay verifies your payment signature, your booking is marked paid and member access is activated automatically.</small></span></aside>
      </div>
    </div>
    <div className="share-grid">
      <button type="button" onClick={() => { window.location.href = 'mailto:?subject=Adyant%20Associates%20Enrollment&body=Complete%20enrollment%20at%20' + encodeURIComponent(window.location.href); }}>✉ <span><strong>Share this to Email</strong><small>Send checkout link to finance or team</small></span></button>
      <button type="button" onClick={() => { window.open('https://wa.me/?text=' + encodeURIComponent(`Adyant Associates Checkout: ${window.location.href}`), '_blank', 'noreferrer'); }}>◉ <span><strong>Share this to WhatsApp</strong><small>Instant checkout link &amp; program details</small></span></button>
    </div>
  </section>;
}

function UpiPanel({ copied, copyUpi, razorpayReady }) {
  return <div className="upi-panel">
    <div className="qr-box"><QrCode /><span>RAZORPAY UPI / QR</span></div>
    <div className="upi-details">
      <h3>Pay instantly with UPI or QR</h3>
      <p>Use GPay, PhonePe, Paytm, BHIM, or any UPI app inside Razorpay Checkout for instant verification and seat confirmation.</p>
      <label>MANUAL VIRTUAL PAYMENT ADDRESS (VPA)</label>
      <div className="vpa">
        <input readOnly value="adyantassociates.admissions@icici" aria-label="UPI payment address" />
        <button onClick={copyUpi} type="button">{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <div className="polling">
        <span>{razorpayReady ? '✓ Razorpay UPI Checkout is ready on the right' : '◌ Add RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in backend/.env to enable live checkout'}</span>
        <small>HMAC-SHA256 Verified</small>
      </div>
    </div>
  </div>;
}

function QrCode() { return <div className="qr-code"><i /><i /><i /><span>AA</span><b /><b /><b /><b /><b /><b /><b /><b /></div>; }

function OrderSummary({ method, paymentConfig }) {
  const plans = paymentConfig.plans || FALLBACK_PLANS;
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    const queryPlan = new URLSearchParams(window.location.search).get('plan');
    return FALLBACK_PLANS.some((plan) => plan.id === queryPlan) ? queryPlan : FALLBACK_PLANS[0].id;
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => window.localStorage.getItem('adyant_member_email') || window.localStorage.getItem('adyant_student_email') || '');
  const [preferredTime, setPreferredTime] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paidReceipt, setPaidReceipt] = useState(null);
  const [booking, setBooking] = useState(null);
  const [bookingError, setBookingError] = useState('');

  const activePlan = plans.find((plan) => plan.id === selectedPlanId) || plans[0];
  const discountPercent = appliedPromo?.discount_percent || 0;
  const baseAmount = activePlan.amount_inr || 0;
  const discountAmount = Math.round((baseAmount * discountPercent) / 100);
  const finalAmount = Math.max(1, baseAmount - discountAmount);

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
      setPromoMessage(`${result.code} applied — ${result.discount_percent}% off.`);
    } catch (requestError) {
      setPromoError(requestError.message);
    }
  }

  function validateFormBeforeSubmit() {
    if (promoCode.trim() && !appliedPromo) {
      setBookingError('Apply the booking code before continuing, or clear it to continue without a code.');
      return false;
    }
    if (!name.trim() || !email.trim()) {
      setBookingError('Please enter your name and email address.');
      return false;
    }
    if (activePlan.requires_preferred_time && !preferredTime) {
      setBookingError('Please choose your preferred date and time for the mock interview.');
      return false;
    }
    return true;
  }

  async function handleRazorpayPayment(event) {
    event.preventDefault();
    if (!validateFormBeforeSubmit()) return;
    setSubmitting(true);
    setBookingError('');
    setBooking(null);
    setPaidReceipt(null);
    setPaymentStatus('Creating Razorpay order…');

    try {
      const orderResponse = await apiRequest('/payments/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          plan_id: activePlan.id,
          preferred_time: preferredTime,
          payment_method: method,
          promo_code: appliedPromo?.code || '',
        }),
      });

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error('Could not load Razorpay Checkout script. Please check your internet connection and try again.');
      }

      setPaymentStatus('Opening Razorpay Checkout…');
      const normalizedEmail = email.trim().toLowerCase();
      window.localStorage.setItem('adyant_student_email', normalizedEmail);

      const razorpayMethodMap = {
        upi: { upi: true },
        card: { card: true },
        bank: { netbanking: true },
      };

      const razorpayOptions = {
        key: orderResponse.key_id,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'Adyant Associates',
        description: activePlan.title,
        order_id: orderResponse.order.id,
        prefill: {
          name: name.trim(),
          email: normalizedEmail,
        },
        notes: {
          booking_id: orderResponse.booking.id,
          plan_id: activePlan.id,
        },
        theme: {
          color: '#2563eb',
        },
        ...(razorpayMethodMap[method] ? { method: razorpayMethodMap[method] } : {}),
        handler: async (response) => {
          setSubmitting(true);
          setPaymentStatus('Verifying payment signature…');
          try {
            const verification = await apiRequest('/payments/razorpay/verify', {
              method: 'POST',
              body: JSON.stringify({
                booking_id: orderResponse.booking.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            window.localStorage.setItem('adyant_member_email', normalizedEmail);
            setPaidReceipt(verification);
            setPaymentStatus('');
          } catch (verifyError) {
            setBookingError(verifyError.message);
            setPaymentStatus('');
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setPaymentStatus('');
            setBookingError('Payment window was closed before completion. You can retry anytime.');
          },
        },
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.on('payment.failed', (failure) => {
        setSubmitting(false);
        setPaymentStatus('');
        setBookingError(failure?.error?.description || 'Razorpay payment failed. Please try another method.');
      });
      rzp.open();
    } catch (requestError) {
      setBookingError(requestError.message);
      setPaymentStatus('');
      setSubmitting(false);
    }
  }

  async function saveBookingWithoutPayment() {
    if (!validateFormBeforeSubmit()) return;
    setSubmitting(true);
    setBookingError('');
    setBooking(null);
    setPaidReceipt(null);
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

  return <section className="summary-column"><form className="summary-card checkout-booking-form" onSubmit={handleRazorpayPayment}>
    <span className="summary-label">01 // PROGRAM SELECTION</span>
    <div className="plan-selector" role="radiogroup" aria-label="Select program">
      {plans.map((plan) => (
        <button
          key={plan.id}
          type="button"
          className={`plan-option ${activePlan.id === plan.id ? 'selected' : ''}`}
          onClick={() => { setSelectedPlanId(plan.id); setBookingError(''); }}
        >
          <strong>{plan.title}</strong>
          <span>{formatInr(plan.amount_inr)}</span>
        </button>
      ))}
    </div>
    <h2>{activePlan.title}</h2>
    <b className="summary-badge">{activePlan.badge}</b>
    <div className="summary-meta">
      <Meta label="SESSION FORMAT" value={activePlan.format} detail="Practical guidance & structured roadmap" />
      <Meta label="MENTORSHIP" value={activePlan.coach} detail="Actionable review & next steps" />
    </div>
    <div className="deliverables">
      <span>ENROLLMENT INCLUDES:</span>
      {['Full program & classroom recording access', 'Structured interview & QA frameworks', 'Personalized improvement plan', 'Instant verified payment receipt'].map((item) => <p key={item}>✓ {item}</p>)}
    </div>
    <fieldset className="booking-contact">
      <legend>YOUR DETAILS</legend>
      <label htmlFor="booking-name">Your name</label>
      <input id="booking-name" name="name" autoComplete="name" maxLength="120" value={name} onChange={(event) => setName(event.target.value)} required />
      <label htmlFor="booking-email">Email for receipt &amp; member access</label>
      <input id="booking-email" name="email" type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <label htmlFor="booking-time">
        Preferred date and time {activePlan.requires_preferred_time ? '' : '(Optional)'}
      </label>
      <input
        id="booking-time"
        name="preferred_time"
        type="datetime-local"
        value={preferredTime}
        onChange={(event) => setPreferredTime(event.target.value)}
        required={Boolean(activePlan.requires_preferred_time)}
      />
    </fieldset>
    <div className="promo">
      <label htmlFor="booking-code">ENTER PROMO CODE</label>
      <div>
        <input id="booking-code" placeholder="Try MOCK10 or FIRSTMOCK15" aria-label="Booking code" value={promoCode} onChange={(event) => { setPromoCode(event.target.value); setAppliedPromo(null); setPromoMessage(''); setPromoError(''); }} />
        <button onClick={applyPromo} type="button">Apply</button>
      </div>
      {promoMessage && <p className="checkout-feedback success" role="status">{promoMessage}</p>}
      {promoError && <p className="checkout-feedback error" role="alert">{promoError}</p>}
    </div>
    <div className="pricing">
      <p><span>{activePlan.title}</span><strong>{formatInr(baseAmount)}</strong></p>
      {appliedPromo && <p className="applied-discount"><span>Promo code ({appliedPromo.code} · {discountPercent}% off)</span><strong>−{formatInr(discountAmount)}</strong></p>}
      <p><span>Preparation materials &amp; portal access</span><small>INCLUDED</small></p>
      <div className="net">
        <span><strong>Total payable</strong><small>Secured by Razorpay</small></span>
        <strong>{formatInr(finalAmount)}<small>{activePlan.currency}</small></strong>
      </div>

      {paymentStatus && <p className="checkout-feedback info" role="status">{paymentStatus}</p>}
      {paidReceipt && (
        <div className="booking-result paid" role="status">
          <strong>✓ Payment Confirmed &amp; Member Access Active</strong>
          <span>Booking Reference: {paidReceipt.booking.id}</span>
          <span>Razorpay Payment ID: {paidReceipt.payment.razorpay_payment_id}</span>
          <span>Amount Paid: {formatInr(paidReceipt.payment.amount_inr)}</span>
          <a className="paid-portal-link" href="/login">Go to Member Sign In →</a>
        </div>
      )}
      {booking && (
        <div className="booking-result" role="status">
          <strong>Booking request saved</strong>
          <span>Reference: {booking.booking.id}</span>
          <span>Status: Pending payment. The team will follow up about your preferred time.</span>
          {!booking.email_sent && <span>{booking.notification_message} Please contact support with your booking reference.</span>}
        </div>
      )}
      {bookingError && <p className="checkout-feedback error" role="alert">{bookingError}</p>}

      <button className="confirm" disabled={submitting} type="submit">
        ▣ {submitting ? (paymentStatus || 'PROCESSING…') : `PAY ${formatInr(finalAmount)} WITH RAZORPAY`}
      </button>
      <button className="confirm-secondary" disabled={submitting} type="button" onClick={saveBookingWithoutPayment}>
        Save booking &amp; pay later
      </button>
    </div>
  </form><div className="guarantee">✓ <span><strong>Verified Razorpay Checkout</strong><small>All payments are verified server-side with HMAC-SHA256 signatures before activating enrollment.</small></span></div></section>;
}

function Meta({ label, value, detail }) { return <div><span>▣ {label}</span><strong>{value}</strong><small>{detail}</small></div>; }

export default Checkout;
