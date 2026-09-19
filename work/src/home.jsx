import { useState } from 'react';
import './home.css';

const pillars = [
  ['01 / Architecture', 'Zero-to-Architect Roadmaps', 'Progress from core language semantics to containerized Selenium Grids, parallel CI runners, and distributed cloud execution.'],
  ['02 / Peer Review', 'Production Code Reviews', 'Every project submission is reviewed by Principal SDET mentors against clean code, DRY, and SOLID design criteria.'],
  ['03 / Sandboxes', 'Live Enterprise Sandboxes', 'Test production-grade microservices, multi-tenant banking apps, and native iOS and Android simulators.'],
  ['04 / Credentials', 'Verified SDET Credentials', 'Earn certificates recognized by hiring committees across Fortune 500 engineering departments and consultancies.'],
  ['05 / AI Testing', 'GenAI & Autonomous QA', 'Integrate LLM test generation, visual regression models, and self-healing DOM selectors into your CI pipeline.'],
  ['06 / Lifetime', 'Lifetime Access & Upgrades', 'Get permanent access to updated video modules, repositories, and new architectural templates with no subscription traps.'],
];

const courses = [
  { type: 'TypeScript', hours: '40 Hours', title: 'Playwright TypeScript with GenAI Agent Automation', description: 'Build resilient end-to-end suites with Playwright, TypeScript, CI/CD GitHub Actions, and LLM-powered test generators.', rating: '4.9', alumni: '28,400', price: '$149', oldPrice: '$299', filter: 'Playwright' },
  { type: 'Flagship',   hours: '80 Hours', title: 'Complete SDET: Selenium 4, Java & Architecture',      description: 'Core Java, data-driven and hybrid frameworks, TestNG, Docker Containers, Jenkins CI/CD, and Selenium Grid 4.',  rating: '4.9', alumni: '120,500', price: '$199', oldPrice: '$399', filter: 'Selenium 4' },
  { type: 'Mobile QA', hours: '35 Hours', title: 'Mobile SDET: Appium 2.0 (iOS & Android)',             description: 'Native and hybrid application automation, cloud device testing, gestures, and CI mobile pipelines.',          rating: '4.8', alumni: '45,200',  price: '$139', oldPrice: '$279', filter: 'Appium Mobile' },
  { type: 'Backend',   hours: '30 Hours', title: 'Full Stack API Automation: RestAssured & Postman',     description: 'REST, GraphQL, JSON Schema validation, JWT workflows, WireMock simulation, and contract testing.',           rating: '4.9', alumni: '65,800',  price: '$129', oldPrice: '$259', filter: 'RestAssured API' },
];

const batches = [
  ['Playwright + GenAI SDET Masterclass',    'Production E2E Architecture',      'Oct 26, 2026', 'Sat & Sun',  '07:30 PM – 10:00 PM IST', '10:00 AM – 12:30 PM EST', 'Rahul Shetty', 'Ex-Staff SDET @ AWS',     '4 seats left',      'urgent'],
  ['Selenium 4 Java SDET Pro Batch',         'Grid 4 & Framework Design',        'Nov 04, 2026', 'Mon – Thu',  '08:00 PM – 09:30 PM IST', '10:30 AM – 12:00 PM EST', 'Arun Kumar',   'Principal SDET @ Uber',   '8 seats remaining', 'soon'],
  ['Appium 2.0 Mobile Testing Intensive',    'iOS & Android Real Device Cloud',  'Nov 15, 2026', 'Sat & Sun',  '06:00 PM – 08:30 PM IST', '08:30 AM – 11:00 AM EST', 'Sanjay Mehta', 'Staff Mobile Architect',  'Open Enrollment',   'open'],
];

/* ── Code lines with line numbers ─────────────────────────────────────────── */
const CODE_LINES = [
  { n: '01', tokens: [{ t: 'kw', v: 'import' }, { t: '', v: ' { test, expect } ' }, { t: 'kw', v: 'from' }, { t: '', v: ' ' }, { t: 'str', v: "'@playwright/test'" }, { t: '', v: ';' }] },
  { n: '02', tokens: [{ t: 'cm', v: '// Autonomous self-healing locator test suite' }] },
  { n: '03', tokens: [{ t: 'fn', v: 'test' }, { t: '', v: '(' }, { t: 'str', v: "'enterprise auth & resilience flow'" }, { t: '', v: ', ' }, { t: 'kw', v: 'async' }, { t: '', v: ' ({ page, aiAgent }) => {' }] },
  { n: '04', indent: true, tokens: [{ t: '', v: 'await page.' }, { t: 'cy', v: 'goto' }, { t: '', v: '(' }, { t: 'str', v: "'https://cloud.adyant.internal'" }, { t: '', v: ');' }] },
  { n: '05', indent: true, tokens: [{ t: '', v: 'await aiAgent.' }, { t: 'cy', v: 'smartResolve' }, { t: '', v: '(' }, { t: 'str', v: "'#sso-login-input'" }, { t: '', v: ').' }, { t: 'cy', v: 'fill' }, { t: '', v: '(' }, { t: 'str', v: "'lead-sdet@corp.io'" }, { t: '', v: ');' }] },
  { n: '06', indent: true, tokens: [{ t: 'kw', v: 'await' }, { t: '', v: ' page.' }, { t: 'cy', v: 'getByRole' }, { t: '', v: '(' }, { t: 'str', v: "'button'" }, { t: '', v: ", { name: " }, { t: 'str', v: "'Authenticate'" }, { t: '', v: ' }).' }, { t: 'cy', v: 'click' }, { t: '', v: '();' }] },
  { n: '07', indent: true, tokens: [{ t: 'cm', v: '// Contract verification + Distributed tracing' }] },
  { n: '08', indent: true, tokens: [{ t: 'kw', v: 'await' }, { t: '', v: ' ' }, { t: 'fn', v: 'expect' }, { t: '', v: '(page.' }, { t: 'cy', v: 'locator' }, { t: '', v: '(' }, { t: 'str', v: "'[data-test-id=metrics]'" }, { t: '', v: ')).' }, { t: 'cy', v: 'toBeVisible' }, { t: '', v: '();' }] },
  { n: '09', indent: true, tokens: [{ t: 'kw', v: 'await' }, { t: '', v: ' aiAgent.' }, { t: 'cy', v: 'auditAccessibilityStandards' }, { t: '', v: '({ level: ' }, { t: 'str', v: "'WCAG-AA'" }, { t: '', v: ' });' }] },
  { n: '10', tokens: [{ t: '', v: '});' }] },
];

function CodeToken({ t, v }) {
  const cls = { kw: 'blue', str: 'green', cy: 'cyan', fn: 'purple', cm: 'comment' }[t] || '';
  return cls ? <span className={cls}>{v}</span> : <>{v}</>;
}

function CodePanel() {
  return (
    <div className="code-panel">
      {/* Window bar */}
      <div className="window-bar">
        <div className="window-left">
          <span className="wdot" /><span className="wdot" /><span className="wdot" />
          <span className="window-filename">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            enterprise-sdet-spec.ts
          </span>
        </div>
        <div className="window-right">
          <span className="code-tag">Playwright + AI</span>
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
        <span className="cf-right">Duration: 840ms on Grid</span>
      </div>
    </div>
  );
}

function Home() {
  const [filter, setFilter]       = useState('All Tracks');
  const [submitted, setSubmitted] = useState(false);

  const visibleCourses =
    filter === 'All Tracks' ? courses : courses.filter((c) => c.filter === filter);

  return (
    <div className="site-shell">

      {/* ── HEADER ── */}
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>
            <strong>adyant<span className="accent">.</span>pro</strong>
            <small>Associates</small>
          </span>
        </a>

        <nav>
          <a className="active" href="/">Home</a>
          <a href="#courses">Courses</a>
          <a href="/membership">Membership</a>
          <a href="#sandboxes">
            Practice Sandboxes
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft:4,verticalAlign:'middle'}}><path d="m6 9 6 6 6-6"/></svg>
          </a>
        </nav>

        <div className="header-actions">
          <button className="search-button" type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search courses...
            <kbd>⌘K</kbd>
          </button>
          <a href="/login">Member Login</a>
          <a className="dark-button compact" href="/membership">Buy Now</a>
        </div>
      </header>

      <main id="top">

        {/* ── HERO ── */}
        <section className="hero section-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              SDET &amp; AUTOMATION ENGINEERING ARCHITECTURE
            </div>

            <h1>
              The next-generation{' '}
              <em>SDET career</em>{' '}
              platform.
            </h1>

            <p>
              Rigorous, live instructor-led bootcamps built for engineers transitioning to
              Principal SDET roles. Master Playwright, Selenium 4, Appium 2.0, Distributed
              Docker Grids, and GenAI test synthesis.
            </p>

            <div className="hero-actions">
              <a className="blue-button" href="#courses">Explore Courses →</a>
              <a className="outline-button" href="#batches">
                <span className="pulse" /> View Live Batches
              </a>
            </div>

            <div className="metrics">
              <div>
                <strong>500k+</strong>
                <span>Engineers Trained</span>
              </div>
              <div>
                <strong>40+</strong>
                <span>Specialized Tracks</span>
              </div>
              <div>
                <strong>4.9<small> / 5.0</small></strong>
                <span>Industry Rating</span>
              </div>
            </div>
          </div>

          <div className="hero-code">
            <CodePanel />
            <p className="commit">
              ⌁ commit <b>8f21bc9</b> — Updated to Playwright 1.45 + GenAI
              <span>Dockerized Grid v4.2</span>
            </p>
          </div>
        </section>

        {/* ── VALUE PILLARS ── */}
        <section className="content-section" id="sandboxes">
          <div className="section-heading">
            <div>
              <span className="section-label">Architecture Standards</span>
              <h2>Engineering Excellence Built for Global Tech Teams</h2>
            </div>
            <p>We strip away non-essential fluff to deliver pure enterprise framework design, cloud execution, and distributed test orchestration.</p>
          </div>
          <div className="pillar-grid">
            {pillars.map(([label, title, text]) => (
              <article className="pillar" key={title}>
                <div className="pillar-icon">⌘</div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="pillar-label">{label}</span>
              </article>
            ))}
          </div>
        </section>

        {/* ── COURSES ── */}
        <section className="content-section courses-section" id="courses">
          <div className="section-heading course-heading">
            <div>
              <span className="section-label">Core Programs</span>
              <h2>Specialized SDET Curriculums</h2>
              <p>Deep, comprehensive engineering tracks built for hands-on code execution.</p>
            </div>
            <div className="filters">
              {['All Tracks', 'Playwright', 'Selenium 4', 'Appium Mobile', 'RestAssured API'].map((name) => (
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

          <div className="course-grid">
            {visibleCourses.map((course) => (
              <article className="course-card" key={course.title}>
                <div className="course-main">
                  <div className="course-meta">
                    <span className={course.type === 'Flagship' ? 'badge blue-badge' : 'badge'}>
                      {course.type}
                    </span>
                    <span>{course.hours}</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="rating">
                    {course.rating} <span>★</span>
                    <small>({course.alumni} alumni)</small>
                  </div>
                </div>
                <div className="course-bottom">
                  <div>
                    <strong>{course.price}</strong> <del>{course.oldPrice}</del>
                  </div>
                  <span className="discount">50% OFF</span>
                  <div className="card-actions">
                    <button type="button">Syllabus</button>
                    <button className="dark-button" type="button">Enroll</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── LIVE BATCHES ── */}
        <section className="content-section batches-section" id="batches">
          <div className="section-heading">
            <div>
              <span className="section-label">Live Cohorts</span>
              <h2>Upcoming Instructor-Led Schedules</h2>
              <p>Limited to 35 engineers per cohort for direct 1-on-1 code mentorship.</p>
            </div>
            <span className="timezone">
              <i /> Timezones synchronized with EST &amp; IST
            </span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cohort Program</th>
                  <th>Start &amp; Cadence</th>
                  <th>Session Timings</th>
                  <th>Lead Mentor</th>
                  <th>Capacity</th>
                  <th>Reservation</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(([title, subtitle, date, cadence, ist, est, mentor, role, capacity, status]) => (
                  <tr key={title}>
                    <td>
                      <strong>{title}</strong>
                      <small>{subtitle}</small>
                    </td>
                    <td>
                      <strong>{date}</strong>
                      <small className="text-blue">{cadence}</small>
                    </td>
                    <td>
                      <strong>{ist}</strong>
                      <small>{est}</small>
                    </td>
                    <td>
                      <div className="mentor">
                        <span>{mentor.split(' ').map((p) => p[0]).join('')}</span>
                        <div>
                          <strong>{mentor}</strong>
                          <small>{role}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`capacity ${status}`}>{capacity}</span>
                    </td>
                    <td>
                      <button className="dark-button" type="button">Book Seat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── SOCIAL PROOF ── */}
        <section className="social-proof content-section">
          <div className="logo-strip">
            {['GOOGLE','AMAZON','MICROSOFT','CAPGEMINI','INFOSYS','DELOITTE','COGNIZANT'].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <div className="trust">
            4.8 / 5.0 <span>★★★★★</span> — Verified by 18,000+ test engineers on Google Reviews
          </div>
          <div className="testimonial-grid">
            {[
              ['01 // CAREER PIVOT',       'I was stuck in manual testing for 5 years with zero Java coding knowledge. The step-by-step guidance helped me crack a Senior SDET role with an 85% salary jump!', 'Priyanka Kulkarni', 'Senior SDET ($135K)'],
              ['02 // ENTERPRISE VALUE',    'Adyant Associates is the gold standard for test automation. The lifetime membership is literally the highest ROI investment I have ever made.',                       'David Miller',      'Lead QA Architect @ FinTech'],
              ['03 // ARCHITECTURE DEPTH', 'The practical sandboxes and live real-world frameworks made all the difference. Every design question was something we had already built in class.',               'Ananya Sen',        'SDET II @ Tier-1 Cloud Enterprise'],
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
                and unlock <b>up to 30% scholarship</b> on upcoming cohorts.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
              <Question title="1. What is your current technical role?" name="role"
                options={['Manual QA / Functional Tester', 'Junior QA Automation', 'Developer transitioning to SDET']} />
              <Question title="2. Which testing stack do you want to master first?" name="stack"
                options={['Playwright + AI', 'Selenium 4 + Java', 'Appium 2.0 Mobile', 'REST & GraphQL API']} />
              <Question title="3. What is your career goal for the next 6-12 months?" name="goal"
                options={['Switch from Manual to SDET', 'Promoted to Lead / Architect', 'Secure Global Remote Offer']} />

              <div className="form-footer">
                <span>{submitted ? 'Your roadmap request has been received.' : 'Immediate feedback report generated upon submission.'}</span>
                <button className="dark-button" type="submit">
                  {submitted ? 'Roadmap Requested ✓' : 'Generate Roadmap & Scholarship →'}
                </button>
              </div>
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
              <strong>adyantassociates<span className="accent">.</span>com</strong>
            </a>
            <p>The premier global engineering academy and professional collective for Software Development Engineers in Test by Adyant Associates.</p>
            <label>SDET ARCHITECTURE DISPATCH</label>
            <div className="subscribe">
              <input aria-label="Work email" placeholder="work-email@company.com" type="email" />
              <button type="button">Join</button>
            </div>
          </div>
          <FooterColumn title="Curriculum"  links={['Playwright TypeScript','Selenium 4 Java Grid','Appium 2.0 Mobile','RestAssured API Suite','Cypress Modern E2E','GenAI for Automation']} />
          <FooterColumn title="Sandboxes"   links={['Banking Web Sandbox','Mobile E-Commerce App','Mock REST API Endpoints','SDET Coding Challenges','GitHub Framework Starters']} />
          <FooterColumn title="Enterprise"  links={['Team & Corporate LMS','Lifetime Membership','Verify Credential ID','Enterprise Syllabus (PDF)','Security & Compliance']} />
        </div>
        <div className="footer-bottom">
          © 2026 Adyant Associates Academy Inc. All rights reserved.
          <span>Privacy Policy　 Terms of Service　 Refund Terms　 System Status</span>
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
      {links.map((link) => <a href="#top" key={link}>{link}</a>)}
    </div>
  );
}

export default Home;