import { useState } from 'react';
import './signin.css';

function SignIn({ onNavigate }) {
  const [authenticated, setAuthenticated] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setAuthenticated(true);
  }

  return (
    <div className="signin-page">
      <header className="signin-header">
        <div className="signin-header-inner">
          <div className="signin-brand-group">
            <button className="signin-brand" type="button" onClick={() => onNavigate('/')}>
              <span className="signin-brand-mark">A</span>
              <span>ADYANT AI QA</span>
            </button>
            <span className="signin-divider" />
            <button className="back-home" type="button" onClick={() => onNavigate('/')}>
              <span aria-hidden="true">←</span> Back to Homepage
            </button>
          </div>
          <nav className="signin-nav"><a href="#courses">Courses</a><a href="#support">Help Desk / Support</a></nav>
          <div className="security-badge"><span /> <span className="security-full">Enterprise SSO &amp; 256-bit Encrypted Session</span><span className="security-short">256-bit SSL</span></div>
        </div>
      </header>

      <main className="signin-main">
        <div className="signin-wrap">
          <div className="protocol-line"><span>{'// SECURE MEMBER ACCESS PROTOCOL // REPOSITORY & LAB INGESTION'}</span><b>v4.19-PROD</b></div>
          <section className="signin-card">
            <div className="signin-accent" />
            <div className="signin-intro"><h1>Sign In to Your QA Career Portal</h1><p>Access your AI for QA Managers guidance, interview preparation resources, and mock interview booking details.</p></div>
            <form className="signin-form" onSubmit={handleSubmit}>
              <SignInField label="Candidate Handle / Username" note="sdet_id / LDAP" icon="@" placeholder="alex.rivera.sdet" type="text" valid />
              <SignInField label="Registered Email Address" note="IDENTITY VERIFIED" icon="✉" placeholder="you@example.com" type="email" />
              <p className="field-help"><span>ⓘ</span> Use the email linked to your program or mock interview booking.</p>
              <div className="signin-options"><label><input defaultChecked type="checkbox" /> <span>Keep this terminal session authenticated for 30 days</span></label><a href="#reset">Trouble signing in? / Reset SDET Credentials</a></div>
              <button className="authenticate-button" type="submit"><span aria-hidden="true">▣</span> {authenticated ? 'Authenticated — Portal Ready' : 'Authenticate & Enter Portal →'}</button>
            </form>
          </section>
          <p className="enrollment-note">Need help choosing a program? Contact <a href="mailto:support@adyantassociates.com">support@adyantassociates.com</a></p>
        </div>
      </main>

      <footer className="signin-footer"><div className="signin-footer-inner"><div className="trust-items"><span><i /> TLS 1.3 Certified</span><b>|</b><span>⚿ Zero-Knowledge Credential Handling</span><b>|</b><span>▣ Hardware Token Compatible (FIDO2/WebAuthn)</span></div><span>© 2025 Adyant Associates. All rights reserved.</span></div></footer>
    </div>
  );
}

function SignInField({ label, note, icon, placeholder, type, valid }) {
  return <div className="signin-field"><div className="field-label"><label htmlFor={label}>{label}</label><span>{note}</span></div><div className="input-wrap"><span className="input-icon" aria-hidden="true">{icon}</span><input id={label} placeholder={placeholder} type={type} required />{valid && <span className="valid-icon" aria-label="Valid">✓</span>}</div></div>;
}

export default SignIn;