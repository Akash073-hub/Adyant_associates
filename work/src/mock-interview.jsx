import { useState } from 'react';
import './mock-interview.css';
import SiteNav from './site-nav';
import { apiRequest } from './api';

const CONTACT_EMAIL = 'akashrbhat73@gmail.com';

function MockInterview() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailWarning, setEmailWarning] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitted(false);
    setEmailSent(false);
    setEmailWarning('');
    setError('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await apiRequest('/mock-interview-requests', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
        }),
      });
      setSubmitted(true);
      setEmailSent(true);
      formElement.reset();
    } catch (requestError) {
      if (requestError.saved) {
        setSubmitted(true);
        setEmailWarning('Your request was saved, but the team email could not be sent. The site owner needs to configure SMTP in backend/.env.');
        formElement.reset();
      } else {
        setError(requestError.message);
      }
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
            <button className="mock-request" type="submit" disabled={submitting}>
              {submitting ? 'Sending request…' : submitted ? 'Request sent ✓' : 'Request a Google Meet link →'}
            </button>
            {submitted && <p className="mock-status" role="status">{emailSent ? `Your request was emailed to ${CONTACT_EMAIL}. We’ll reply with available times and the Google Meet link.` : 'Your request was saved.'}</p>}
            {emailWarning && <p className="mock-error" role="alert">{emailWarning}</p>}
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
