import { useEffect, useState } from 'react';
import './home.css';
import SiteNav from './site-nav';
import { focusSearchTarget, getSearchQuery } from './search-navigation';
import { apiRequest } from './api';

/* ── Code lines with line numbers ─────────────────────────────────────────── */
const CODE_LINES = [
  { n: '01', tokens: [{ t: 'kw', v: 'import' }, { t: '', v: ' { qaAgent, expect } ' }, { t: 'kw', v: 'from' }, { t: '', v: ' ' }, { t: 'str', v: "'@adyant/ai-testing'" }, { t: '', v: ';' }] },
  { n: '02', tokens: [{ t: 'cm', v: '// AI-assisted quality risk assessment' }] },
  { n: '03', tokens: [{ t: 'fn', v: 'qaAgent' }, { t: '', v: '(' }, { t: 'str', v: "'release-readiness review'" }, { t: '', v: ', ' }, { t: 'kw', v: 'async' }, { t: '', v: ' ({ build, evidence }) => {' }] },
  { n: '04', indent: true, tokens: [{ t: 'kw', v: 'const' }, { t: '', v: ' riskMap = ' }, { t: 'cy', v: 'analyzeQualityRisk' }, { t: '', v: '({ build, evidence });' }] },
  { n: '05', indent: true, tokens: [{ t: 'kw', v: 'await' }, { t: '', v: ' qaAgent.' }, { t: 'cy', v: 'generateTestPlan' }, { t: '', v: '({ riskMap, priority: ' }, { t: 'str', v: "'critical'" }, { t: '', v: ' });' }] },
  { n: '06', indent: true, tokens: [{ t: 'kw', v: 'await' }, { t: '', v: ' qaAgent.' }, { t: 'cy', v: 'validateAcceptanceCriteria' }, { t: '', v: '({ coverage: ' }, { t: 'str', v: "'regression'" }, { t: '', v: ' });' }] },
  { n: '07', indent: true, tokens: [{ t: 'cm', v: '// Human review + AI-assisted coverage insights' }] },
  { n: '08', indent: true, tokens: [{ t: 'kw', v: 'await' }, { t: '', v: ' ' }, { t: 'fn', v: 'expect' }, { t: '', v: '(riskMap.' }, { t: 'cy', v: 'criticalFindings' }, { t: '', v: ').' }, { t: 'cy', v: 'toBeWithinThreshold' }, { t: '', v: '(0);' }] },
  { n: '09', indent: true, tokens: [{ t: 'kw', v: 'await' }, { t: '', v: ' qaAgent.' }, { t: 'cy', v: 'auditAccessibilityAndRisk' }, { t: '', v: '({ standard: ' }, { t: 'str', v: "'WCAG-AA'" }, { t: '', v: ' });' }] },
  { n: '10', tokens: [{ t: '', v: '});' }] },
];

function CodeToken({ t, v }) {
  const cls = { kw: 'blue', str: 'green', cy: 'cyan', fn: 'purple', cm: 'comment' }[t] || '';
  return cls ? <span className={cls}>{v}</span> : <>{v}</>;
}

function CodePanel() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handlePointerMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      className="code-panel"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      style={{ '--tilt-x': `${tilt.x}deg`, '--tilt-y': `${tilt.y}deg` }}
    >
      {/* Window bar */}
      <div className="window-bar">
        <div className="window-left">
          <span className="wdot" /><span className="wdot" /><span className="wdot" />
          <span className="window-filename">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ai-qa-release-review.ts
          </span>
        </div>
        <div className="window-right">
          <span className="code-tag">AI Testing + QA</span>
          <span className="wdot wdot-green" />
        </div>
      </div>

      {/* Code body with line numbers */}
      <div className="code-body">
        <div className="line-nums">
          {CODE_LINES.map(({ n }) => <div key={n} className="ln">{n}</div>)}
        </div>
        <div className="code-lines">
          {CODE_LINES.map(({ n, indent, tokens }) => (
            <div key={n} className={indent ? 'cl cl-indent' : 'cl'}>
              {tokens.map((tok, i) => <CodeToken key={i} {...tok} />)}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="code-footer">
        <div className="cf-left">
          <span className="pass">✓ 14 specs passed</span>
          <span className="cf-sep">|</span>
          <span>0 flaky</span>
        </div>
        <span className="cf-right">Preparation plan ready</span>
      </div>
    </div>
  );
}

function Home() {
  const [filter, setFilter]       = useState('All Programs');
  const [search, setSearch]       = useState('');
  const [programs, setPrograms]   = useState([]);
  const [cohorts, setCohorts]     = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');

  useEffect(() => {
    apiRequest('/programs')
      .then((catalog) => {
        setPrograms(catalog.programs || []);
        setCohorts(catalog.cohorts || []);
      })
      .catch(() => { setPrograms([]); setCohorts([]); })
      .finally(() => setCatalogLoading(false));
  }, []);

  async function submitAssessment(event) {
    event.preventDefault();
    setAssessmentError('');
    setSubmitted(false);
    setSubmittingAssessment(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest('/assessments', {
        method: 'POST',
        body: JSON.stringify({
          role: form.get('role'),
          stack: form.get('stack'),
          goal: form.get('goal'),
        }),
      });
      setSubmitted(true);
    } catch (requestError) {
      setAssessmentError(requestError.message);
    } finally {
      setSubmittingAssessment(false);
    }
  }

  useEffect(() => {
    const query = getSearchQuery();
    if (query) setSearch(query);
  }, []);

  useEffect(() => {
    focusSearchTarget(search);
  }, [search]);

  const visibleCourses =
    filter === 'All Programs' ? programs : programs.filter((program) => program.title === filter);
  const searchedCourses = visibleCourses.filter((course) =>
    `${course.title} ${course.description} ${course.type}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="site-shell">

      <SiteNav active="home" searchValue={search} onSearchChange={(event) => setSearch(event.target.value)} />

      <main id="top">

        {/* ── HERO ── */}
        <section className="hero section-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              AI-POWERED QA CAREER DEVELOPMENT
            </div>

            <h1>
              Build confidence for your{' '}
              <em>next QA opportunity</em>.
            </h1>

            <p>
              Focused learning and interview support for QA managers and quality engineers.
              Learn how to lead with AI, prepare strategically, and practice with realistic mock interviews.
            </p>

            <div className="hero-actions">
              <a className="blue-button" href="#courses">Explore Programs →</a>
            </div>

            <div className="metrics">
              <div>
                <strong>3</strong>
                <span>Focused programs</span>
              </div>
              <div>
                <strong>1:1</strong>
                <span>Mock interview support</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Practical guidance</span>
              </div>
            </div>
          </div>

          <div className="hero-code">
            <CodePanel />
            <p className="commit">
              ⌁ guide <b>QA-AI-01</b> — Updated for practical AI leadership
              <span>Interview support ready</span>
            </p>
          </div>
        </section>

        {/* ── VALUE PILLARS ── */}
        <section className="content-section" id="support">
          <div className="section-heading">
            <div>
              <span className="section-label">How We Help</span>
              <h2>Practical support for your next career move</h2>
            </div>
            <p>Choose the focused support you need, from AI leadership guidance to interview preparation and live mock practice.</p>
          </div>
          <div className="pillar-grid">
            {programs.map((program, index) => (
              <article className="pillar" key={program.id}>
                <div className="pillar-icon">⌘</div>
                <h3>{program.title}</h3>
                <p>{program.description}</p>
                <span className="pillar-label">{String(index + 1).padStart(2, '0')} / {program.type.toUpperCase()}</span>
              </article>
            ))}
          </div>
        </section>

        {/* ── COURSES ── */}
        <section className="content-section courses-section" id="courses">
          <div className="section-heading course-heading">
            <div>
              <span className="section-label">Our Programs</span>
              <h2>Choose the right next step</h2>
              <p>Clear, focused resources without extra courses or distractions.</p>
            </div>
            <div className="filters">
              {['All Programs', ...programs.map((program) => program.title)].map((name) => (
                <button
                  className={filter === name ? 'selected' : ''}
                  key={name}
                  onClick={() => setFilter(name)}
                  type="button"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {catalogLoading ? <p className="search-empty">Loading programs…</p> : <div className="course-grid">
            {searchedCourses.map((course) => (
              <article className="course-card" id={`course-${course.id}`} key={course.id} tabIndex={-1}>
                <div className="course-main">
                  <div className="course-meta">
                    <span className={course.status === 'available' ? 'badge blue-badge' : 'badge'}>
                      {course.status === 'coming_soon' ? 'Coming soon' : course.type}
                    </span>
                    <span>{course.format}</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="rating">
                    {course.rating && <>{course.rating} <span>★</span></>}
                    {course.alumni && <small>({course.alumni} alumni)</small>}
                  </div>
                </div>
                <div className="course-bottom">
                  <div>
                    <strong>{course.price_label}</strong> <del>{course.old_price}</del>
                  </div>
                  <span className="discount">50% OFF</span>
                  <div className="card-actions">
                    <a className="syllabus-button" href={course.syllabus_url || '/membership#curriculum'}>Syllabus</a>
                    <a className="dark-button" href={course.action_url || '/membership#curriculum'}>{course.price_label || 'Explore'}</a>
                  </div>
                </div>
              </article>
            ))}
          </div>}
          {!catalogLoading && searchedCourses.length === 0 && <p className="search-empty">No programs match “{search}”.</p>}
        </section>

        {/* ── LIVE BATCHES ── */}
        <section className="content-section batches-section" id="batches">
          <div className="section-heading">
            <div>
              <span className="section-label">Current Cohorts</span>
                <h2>Upcoming schedules</h2>
                <p>Review the session times, instructors, and available seats for each program.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cohort Program</th>
                  <th>Format</th>
                  <th>Session Timings</th>
                  <th>Lead Mentor</th>
                  <th>Capacity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr key={cohort.id}>
                    <td>
                      <strong>{cohort.program_title}</strong>
                      <small>{cohort.title}</small>
                    </td>
                    <td>
                      <strong>{cohort.start_date}</strong>
                      <small className="text-blue">{cohort.schedule}</small>
                    </td>
                    <td>
                      <strong>{cohort.time_ist}</strong>
                      <small>{cohort.time_est}</small>
                    </td>
                    <td>
                      <div className="mentor">
                        <span>{(cohort.instructor || 'QA').split(' ').map((p) => p[0]).join('')}</span>
                        <div>
                          <strong>{cohort.instructor}</strong>
                          <small>{cohort.instructor_role}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`capacity ${cohort.status}`}>{cohort.status === 'open' && cohort.seats_available > 0 ? `${cohort.seats_available} seats left` : cohort.status === 'soon' ? 'Coming soon' : 'Closed'}</span>
                    </td>
                    <td>
                      {cohort.status === 'open' && cohort.seats_available > 0
                        ? <a className="dark-button" href={cohort.booking_url || '/membership#curriculum'}>Book session</a>
                        : <span className="dark-button" aria-disabled="true">Unavailable</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── SOCIAL PROOF ── */}
        <section className="social-proof content-section" id="social-proof" tabIndex={-1}>
          <div className="logo-strip">Trusted QA learning community</div>
          <div className="trust">
          {programs.length} focused programs <span>★</span> — practical support for QA career growth
          </div>
          <div className="testimonial-marquee">
            <div className="testimonial-track">
            {[
              ['01 // CAREER PIVOT',       'The interview preparation guide helped me organize my experience and approach my next QA leadership interview with confidence.', 'Harsha Puranik', 'QA Manager Candidate'],
              ['02 // INTERVIEW READY',    'The focused guidance made difficult interview questions easier to answer with clear examples and practical structure.', 'Vani Bhat', 'Quality Engineering Candidate'],
              ['03 // MOCK CONFIDENCE', 'The live mock interview gave me clear, honest feedback and a practical plan for answering difficult QA leadership questions.', 'Suresh Reddy', 'QA Manager Candidate'],
              ['01 // CAREER PIVOT',       'The interview preparation guide helped me organize my experience and approach my next QA leadership interview with confidence.', 'Harsha Puranik', 'QA Manager Candidate'],
              ['02 // INTERVIEW READY',    'The focused guidance made difficult interview questions easier to answer with clear examples and practical structure.', 'Vani Bhat', 'Quality Engineering Candidate'],
              ['03 // MOCK CONFIDENCE', 'The live mock interview gave me clear, honest feedback and a practical plan for answering difficult QA leadership questions.', 'Suresh Reddy', 'QA Manager Candidate'],
            ].map(([label, quote, name, role]) => (
              <article className="testimonial" key={label}>
                <span className="testimonial-label">{label}</span>
                <p>"{quote}"</p>
                <footer>
                  <span>{name.split(' ').map((p) => p[0]).join('')}</span>
                  <div>
                    <strong>{name}</strong>
                    <small>{role}</small>
                  </div>
                </footer>
              </article>
            ))}
            </div>
          </div>
        </section>

        {/* ── ASSESSMENT ── */}
        <section className="assessment content-section" id="membership">
          <div className="assessment-box">
            <div className="assessment-heading">
              <span className="eyebrow">
                <span className="eyebrow-dot" /> 3-MINUTE DIAGNOSTIC
              </span>
              <h2>Assess Your Automation Readiness</h2>
              <p>
                Identify your testing skill gaps, receive a personalized learning roadmap,
                and choose the right preparation path for your next interview.
              </p>
            </div>

            <form onSubmit={submitAssessment}>
              <Question title="1. What is your current technical role?" name="role"
                options={['Manual QA / Functional Tester', 'Junior QA Automation', 'Developer transitioning to SDET']} />
              <Question title="2. Which testing stack do you want to master first?" name="stack"
                options={programs.map((program) => program.title)} />
              <Question title="3. What is your career goal for the next 6-12 months?" name="goal"
                options={['Switch from Manual to SDET', 'Promoted to Lead / Architect', 'Secure Global Remote Offer']} />

              <div className="form-footer">
                <span aria-live="polite">{assessmentError || (submitted ? 'Your roadmap request has been saved.' : 'Immediate feedback report generated upon submission.')}</span>
                <button className="dark-button" type="submit" disabled={submittingAssessment}>
                  {submittingAssessment ? 'Saving your assessment…' : submitted ? 'Roadmap Requested ✓' : 'Generate Roadmap & Scholarship →'}
                </button>
              </div>
              {assessmentError && <p className="field-help" role="alert">Could not save your assessment. {assessmentError}</p>}
            </form>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <span className="brand-mark">A</span>
              <strong>Adyant Associates</strong>
            </a>
            <p>Focused AI leadership and interview preparation support for QA managers and quality engineers.</p>
            <label>QA CAREER DISPATCH</label>
            <div className="subscribe">
              <input aria-label="Work email" placeholder="you@example.com" type="email" />
              <button type="button">Join</button>
            </div>
          </div>
          <FooterColumn title="Programs" links={programs.map((program) => ({ label: program.title, href: program.program_url || '/membership#curriculum' }))} />
          <FooterColumn title="Interview Support" links={['Book your mock interview','Preparation checklist','Feedback and next steps']} />
          <FooterColumn title="Support" links={['About the programs','Contact support','Privacy and security']} />
        </div>
        <div className="footer-bottom">
          © 2026 Adyant Associates. All rights reserved.
          <span><a href="/support">Privacy &amp; Support</a>　 Terms of Service　 Refund Terms　 System Status</span>
        </div>
      </footer>
    </div>
  );
}

function Question({ title, name, options }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="options">
        {options.map((option, i) => (
          <label key={option}>
            <input defaultChecked={i === 0} name={name} type="radio" value={option} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div className="footer-column">
      <h4>{title}</h4>
      {links.map((item) => {
        const link = typeof item === 'string' ? item : item.label;
        const href = typeof item === 'string' ? (
          link === 'Book your mock interview'
            ? '/membership#curriculum'
            : link === 'Preparation checklist'
              ? '#courses'
              : link === 'Contact support' || link === 'Privacy and security'
                ? '/support'
                : link === 'Feedback and next steps'
                  ? '#membership'
                  : '#top'
        ) : item.href;
        return (
        <a
          href={href}
          key={link}
        >
          {link}
        </a>
      ); })}
    </div>
  );
}

export default Home;
