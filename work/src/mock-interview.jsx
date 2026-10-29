import { useState } from 'react';
import './mock-interview.css';
import SiteNav from './site-nav';
import { apiRequest } from './api';

const CONTACT_EMAIL = 'akashrbhat73@gmail.com';

function MockInterview() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitted(false);
    setError('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await apiRequest('/mock-interview-requests', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          preferred_time: form.get('preferred_time'),
        }),
      });
      setSubmitted(true);
      formElement.reset();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const requestAnchor = '#request-form';
  return (
    <div className="mock-page">
      <SiteNav active="mock" coursesHref="/membership#curriculum" mockHref="/mock-interview" ctaHref={requestAnchor} ctaLabel="Request a Meet link" showCta />
      <main className="mock-main">
        <section className="mock-card" aria-labelledby="mock-title">
          <span className="mock-eyebrow">INTERVIEW PRACTICE / 1:1 SESSION</span>
          <h1 id="mock-title">Book a mock interview</h1>
          <p className="mock-intro">Request a session and we’ll reply with available times and a Google Meet link.</p>
          <div className="mock-contact">
            <span>CONTACT</span>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
          <form className="mock-request-form" id="request-form" onSubmit={handleSubmit}>
            <label htmlFor="request-name">Your name</label>
            <input id="request-name" name="name" type="text" maxLength="120" required />
            <label htmlFor="request-email">Your email</label>
            <input id="request-email" name="email" type="email" maxLength="254" required />
            <label htmlFor="preferred-time">Preferred date and time</label>
            <input id="preferred-time" name="preferred_time" type="datetime-local" required />
            <button className="mock-request" type="submit" disabled={submitting}>
              {submitting ? 'Sending request…' : submitted ? 'Request sent ✓' : 'Request a Google Meet link →'}
            </button>
            {submitted && <p className="mock-status" role="status">Your request was emailed to {CONTACT_EMAIL}.</p>}
            {error && <p className="mock-error" role="alert">{error}</p>}
          </form>
          <p className="mock-note">We’ll email you available times and the Google Meet link.</p>
          <a className="mock-back" href="/membership">Explore membership programs</a>
        </section>
      </main>
    </div>
  );
}

export default MockInterview;
