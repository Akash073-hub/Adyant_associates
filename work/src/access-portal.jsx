import './access-portal.css';
import { useState } from 'react';
import { apiRequest } from './api';

function AccessPortal({ view = 'welcome' }) {
  const student = view === 'student';
  const browse = view === 'browse';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleBrowse(event) {
    event.preventDefault();
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest('/student-leads', { method: 'POST', body: JSON.stringify({ email: form.get('email'), interest: form.get('interest'), current_status: form.get('current_status'), current_status_details: form.get('current_status_details') }) });
      setSubmitted(true);
      window.location.assign('/home');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }
  return (
    <main className="access-page">
      <section className="access-card" aria-labelledby="access-title">
        <a className="access-brand" href="/" aria-label="Adyant Associates access home">
          <span className="access-brand-mark">A</span> Adyant Associates
        </a>
        <span className="access-eyebrow">{browse ? 'BROWSE AS A STUDENT' : student ? 'STUDENT ACCESS' : 'WELCOME'}</span>
        <h1 id="access-title">{browse ? 'Tell us a little about yourself' : student ? 'Choose how to continue' : 'How would you like to continue?'}</h1>
        <p>{browse ? 'Share your email to explore our programs. The other details are optional.' : student ? 'Sign in to check your member access, or continue as a new student.' : 'Choose student access to explore our programs, or sign in to the administration area.'}</p>
        {browse ? <form className="access-form" onSubmit={handleBrowse}>
          <label htmlFor="browse-email">Email address <span>Required</span></label><input id="browse-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          <label htmlFor="browse-interest">What are you interested in? <span>Optional</span></label><select id="browse-interest" name="interest" defaultValue=""><option value="">Choose a career path or topic</option><option>AI for QA / Quality Engineering</option><option>Software Testing and Test Automation</option><option>Full Stack Development</option><option>Frontend Development</option><option>Backend Development</option><option>Agentic AI Engineering</option><option>Generative AI and LLM Applications</option><option>Data Science and Machine Learning</option><option>Data Engineering and Analytics</option><option>Cloud and DevOps Engineering</option><option>Mobile App Development</option><option>Cybersecurity</option><option>UI / UX Design</option><option>Product Management</option><option>Business Analysis</option><option>Interview Preparation and Career Growth</option><option>Changing careers into technology</option><option>Not sure yet — exploring options</option><option>Other</option></select>
          <label htmlFor="browse-status">What are you doing currently? <span>Optional</span></label><select id="browse-status" name="current_status" defaultValue=""><option value="">Select the option that fits best</option><option>High school student</option><option>College / university student</option><option>Studying computer science or IT</option><option>Studying another subject</option><option>Recent graduate</option><option>Working in QA / software testing</option><option>Working as a software developer</option><option>Working in AI, data, cloud, or DevOps</option><option>Working in another technology role</option><option>Working in a non-technology role</option><option>Freelancer or independent professional</option><option>Looking for my first job</option><option>Currently between jobs</option><option>Planning a career change into technology</option><option>Returning to work or study</option><option>Other</option><option>Prefer not to say</option></select>
          <label htmlFor="browse-status-details">Anything else about your current situation? <span>Optional</span></label><input id="browse-status-details" name="current_status_details" type="text" maxLength="240" placeholder="For example, your degree, role, or career goal" />
          {error && <p className="access-error" role="alert">{error}</p>}
          {submitted && <p role="status">Thanks. Taking you to the programs…</p>}
          <button className="access-submit" disabled={busy} type="submit">{busy ? 'Saving…' : 'Continue to programs →'}</button>
          <a className="access-back" href="/student-login">← Back to access options</a>
        </form> : <div className="access-actions">
          {student ? (
            <>
              <a className="access-action primary" href="/login"><strong>Member login</strong><span>Check whether your email has an active membership</span><b aria-hidden="true">→</b></a>
              <a className="access-action" href="/browse"><strong>Browse as a student</strong><span>Share your email and explore our programs</span><b aria-hidden="true">→</b></a>
            </>
          ) : (
            <>
              <a className="access-action primary" href="/student-login"><strong>Student login</strong><span>Member access or browse programs</span><b aria-hidden="true">→</b></a>
              <a className="access-action" href="/admin-login"><strong>Admin login</strong><span>Sign in to the administration area</span><b aria-hidden="true">→</b></a>
            </>
          )}
        </div>}
        {student && <a className="access-back" href="/">← Back to access options</a>}
      </section>
      <footer className="access-footer">© 2026 Adyant Associates</footer>
    </main>
  );
}

export default AccessPortal;
