import './access-portal.css';

function AccessPortal({ view = 'welcome' }) {
  const student = view === 'student';
  return (
    <main className="access-page">
      <section className="access-card" aria-labelledby="access-title">
        <a className="access-brand" href="/" aria-label="Adyant Associates access home">
          <span className="access-brand-mark">A</span> Adyant Associates
        </a>
        <span className="access-eyebrow">{student ? 'STUDENT ACCESS' : 'WELCOME'}</span>
        <h1 id="access-title">{student ? 'Choose how to continue' : 'How would you like to continue?'}</h1>
        <p>{student ? 'Sign in to your member account or browse programs and enroll as a visitor.' : 'Choose student access to explore our programs, or sign in to the administration area.'}</p>
        <div className="access-actions">
          {student ? (
            <>
              <a className="access-action primary" href="/login"><strong>Member login</strong><span>Open your member account</span><b aria-hidden="true">→</b></a>
              <a className="access-action" href="/home"><strong>Browse as a student</strong><span>Explore the website and enroll in a program</span><b aria-hidden="true">→</b></a>
            </>
          ) : (
            <>
              <a className="access-action primary" href="/student-login"><strong>Student login</strong><span>Member access or browse programs</span><b aria-hidden="true">→</b></a>
              <a className="access-action" href="/admin-login"><strong>Admin login</strong><span>Sign in to the administration area</span><b aria-hidden="true">→</b></a>
            </>
          )}
        </div>
        {student && <a className="access-back" href="/">← Back to access options</a>}
      </section>
      <footer className="access-footer">© 2026 Adyant Associates</footer>
    </main>
  );
}

export default AccessPortal;
