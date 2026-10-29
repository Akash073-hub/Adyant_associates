import './mock-interview.css';
import SiteNav from './site-nav';

const CONTACT_EMAIL = 'akashrbhat73@gmail.com';
const requestSubject = encodeURIComponent('Request a Google Meet link for a mock interview');
const requestBody = encodeURIComponent('Hello Akash,\n\nI would like to book a mock interview. Please share the available times and Google Meet link.\n\nMy name:\nMy preferred date and time:');
const requestHref = `mailto:${CONTACT_EMAIL}?subject=${requestSubject}&body=${requestBody}`;

function MockInterview() {
  return (
    <div className="mock-page">
      <SiteNav active="mock" coursesHref="/membership#curriculum" mockHref="/mock-interview" ctaHref={requestHref} ctaLabel="Request a Meet link" showCta />
      <main className="mock-main">
        <section className="mock-card" aria-labelledby="mock-title">
          <span className="mock-eyebrow">INTERVIEW PRACTICE / 1:1 SESSION</span>
          <h1 id="mock-title">Book a mock interview</h1>
          <p className="mock-intro">Request a session and we’ll reply with available times and a Google Meet link.</p>
          <div className="mock-contact">
            <span>CONTACT</span>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
          <a className="mock-request" href={requestHref}>Request a Google Meet link <span aria-hidden="true">→</span></a>
          <p className="mock-note">Your email will open with a ready-to-send request. Include the date and time that works best for you.</p>
          <a className="mock-back" href="/membership">Explore membership programs</a>
        </section>
      </main>
    </div>
  );
}

export default MockInterview;
