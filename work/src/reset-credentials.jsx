import { useState } from 'react';
import './signin.css';
import SiteNav from './site-nav';

function ResetCredentials() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="signin-page">
      <SiteNav active="" coursesHref="/membership#curriculum" mockHref="/#batches" ctaHref="/checkout" showLogin={false} />
      <main className="signin-main">
        <div className="signin-wrap">
          <div className="protocol-line"><span>{'// CREDENTIAL RECOVERY PROTOCOL // MEMBER IDENTITY VERIFICATION'}</span></div>
          <section className="signin-card">
            <div className="signin-accent" />
            <div className="signin-intro"><h1>Reset Your SDET Credentials</h1><p>Enter the email address you used when purchasing your course or mock interview. We’ll use it to locate your member access and send the next steps.</p></div>
            <form className="signin-form" onSubmit={handleSubmit}>
              <SignInField label="Purchase Email Address" note="IDENTITY LOOKUP" icon="✉" placeholder="you@example.com" type="email" />
              <p className="field-help"><span>ⓘ</span> Use the same email linked to your course or mock interview booking.</p>
              <button className="authenticate-button" type="submit"><span aria-hidden="true">✉</span> {submitted ? 'Recovery Request Sent' : 'Send Reset Instructions →'}</button>
            </form>
            {submitted && <p className="enrollment-note">If the email matches a purchase, reset instructions will be sent shortly.</p>}
          </section>
        </div>
      </main>
      <footer className="signin-footer"><div className="signin-footer-inner"><span>Need more help? Contact support.</span><span>© 2025 Adyant Associates. All rights reserved.</span></div></footer>
    </div>
  );
}

function SignInField({ label, note, icon, placeholder, type }) {
  return <div className="signin-field"><div className="field-label"><label htmlFor={label}>{label}</label><span>{note}</span></div><div className="input-wrap"><span className="input-icon" aria-hidden="true">{icon}</span><input id={label} placeholder={placeholder} type={type} required /></div></div>;
}

export default ResetCredentials;
