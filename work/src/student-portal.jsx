import { useEffect, useMemo, useState } from 'react';
import './student-portal.css';
import { apiRequest } from './api';

const descriptions = {
  'ai-for-qa-managers': 'A practical guide to leading AI adoption in QA, with governance, workflows, and implementation checkpoints.',
  'interview-preparation-guide': 'A structured plan for preparing confident QA manager and automation interview answers.',
  'ready-mock-preparation': 'Practice with a live mock interview, direct feedback, and a prioritized improvement plan.',
};

function StudentPortal() {
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email] = useState(() => window.localStorage.getItem('adyant_member_email') || window.localStorage.getItem('adyant_student_email') || '');
  const [displayName] = useState(() => window.localStorage.getItem('adyant_member_name') || '');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    Promise.all([apiRequest('/programs'), apiRequest('/videos')])
      .then(([catalog, library]) => {
        setPrograms(catalog.programs || []);
        setCohorts(catalog.cohorts || []);
        setVideos(library.videos || []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const initials = useMemo(() => (displayName || email.split('@')[0] || 'Student').slice(0, 2).toUpperCase(), [displayName, email]);
  const purchasedPrograms = [];

  return <div className="student-shell">
    <aside className="student-sidebar">
      <a className="student-brand" href="/home"><span className="student-brand-mark">A</span><span>Adyant Associates<small>STUDENT PORTAL</small></span></a>
      <div className="student-side-label">LEARNING SPACE</div>
      <nav className="student-side-nav" aria-label="Student portal sections">
        {['Overview', 'My programs', 'Learning library', 'Bookings', 'Certificates'].map((tab, index) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => { setActiveTab(tab); document.getElementById(`student-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} type="button"><span aria-hidden="true">{['⌂', '▤', '▶', '◷', '✧'][index]}</span>{tab}{tab === 'My programs' && <b>{purchasedPrograms.length}</b>}</button>)}
      </nav>
      <div className="student-sidebar-bottom"><span className="student-help-icon">?</span><div><strong>Need a hand?</strong><small>Our team is here to help.</small></div><a href="/support" aria-label="Contact support">→</a></div>
    </aside>

    <main className="student-main">
      <header className="student-topbar"><div className="student-breadcrumb">Student Portal <span>/</span> <b>{activeTab}</b></div><div className="student-top-actions"><a className="student-avatar" href="/student-profile" title={email || 'Student profile'} aria-label="Open your profile">{initials}</a></div></header>
      <div className="student-content">
        <section className="student-welcome" id="student-0"><div><span className="student-kicker">YOUR LEARNING SPACE</span><h1>Welcome{displayName ? `, ${displayName}` : email ? `, ${email.split('@')[0]}` : ''} <span>✦</span></h1><p>Your programs, learning materials, and next steps—all in one place.</p></div><div className="student-date"><span>YOUR PORTAL</span><strong>Student access</strong><small>{email || 'Browse mode'}</small></div></section>

        {error && <div className="student-notice" role="alert"><strong>Some portal information could not load.</strong> {error} <button type="button" onClick={() => window.location.reload()}>Try again</button></div>}

        <section className="student-summary-grid" aria-label="Learning summary">
          <article><span className="student-summary-icon blue">▤</span><div><small>ACTIVE PROGRAMS</small><strong>{purchasedPrograms.length}</strong><em>{purchasedPrograms.length ? 'Ready to continue' : 'No active enrollments yet'}</em></div></article>
          <article><span className="student-summary-icon green">◉</span><div><small>LEARNING PROGRESS</small><strong>—</strong><em>Progress appears after enrollment</em></div></article>
          <article><span className="student-summary-icon amber">◷</span><div><small>UPCOMING SESSIONS</small><strong>—</strong><em>No booking details on file</em></div></article>
          <article><span className="student-summary-icon violet">✧</span><div><small>CERTIFICATES</small><strong>0</strong><em>Earned after program completion</em></div></article>
        </section>

        <section className="student-section" id="student-1"><div className="student-section-heading"><div><span className="student-kicker">YOUR JOURNEY</span><h2>My programs</h2></div><a href="/membership">Browse all programs <span>→</span></a></div>
          {purchasedPrograms.length ? <div className="student-program-grid">{purchasedPrograms.map((program) => <ProgramCard key={program.id} program={program} cohort={cohorts.find((item) => item.program_id === program.id)} />)}</div> : <div className="student-empty"><div className="student-empty-symbol">▤</div><div><h3>Your learning journey starts here</h3><p>There are no active enrollments linked to this browse session. Explore our programs to find the right next step.</p><a href="/membership">Explore programs <span>→</span></a></div></div>}
        </section>

        <section className="student-section student-catalog-section"><div className="student-section-heading"><div><span className="student-kicker">FIND YOUR NEXT STEP</span><h2>Programs to explore</h2></div><a href="/membership">View program details <span>→</span></a></div>
          {loading ? <p className="student-loading">Loading programs…</p> : <div className="student-program-grid">{programs.map((program) => <ProgramCard key={program.id} program={program} cohort={cohorts.find((item) => item.program_id === program.id)} />)}</div>}
        </section>

        <section className="student-section" id="student-2"><div className="student-section-heading"><div><span className="student-kicker">WATCH &amp; LEARN</span><h2>Learning library</h2><p>Watch previous classes and review their notes.</p></div></div>
          {loading ? <p className="student-loading">Loading learning materials…</p> : <div className="student-library-grid"><article className="student-feature-video">{selectedVideo ? <VideoFrame video={selectedVideo} /> : <div className="student-feature-art"><div className="student-art-orbit orbit-one"/><div className="student-art-orbit orbit-two"/><span>AA</span><button onClick={() => setSelectedVideo(videos[0] || null)} type="button" aria-label="Open video library">▶</button></div>}<div className="student-feature-copy"><span>PREVIOUS CLASSES</span><h3>{selectedVideo?.title || 'Class recordings and notes'}</h3><p>{selectedVideo?.description || 'Choose a class to watch its recording and review the notes.'}</p><a href="#student-previous-classes">View classroom preview →</a></div></article>
            <div className="student-material-list" id="student-previous-classes"><div className="student-material-head"><strong>Previous classes</strong><span>{videos.length} videos</span></div>{videos.length ? videos.map((video) => <button className={selectedVideo?.id === video.id ? 'selected' : ''} key={video.id} onClick={() => setSelectedVideo(video)} type="button"><span className="material-play">▶</span><span><strong>{video.title}</strong><small>{video.description ? `Notes: ${video.description}` : 'Class recording'}</small></span><b>▶</b></button>) : <div className="student-material-empty"><span>▧</span><strong>No previous classes yet</strong><p>Class recordings and notes will appear here when they are added.</p></div>}</div>
          </div>}
        </section>

        <section className="student-lower-grid">
          <article className="student-detail-card" id="student-3"><div className="student-section-heading compact"><div><span className="student-kicker">LIVE &amp; UPCOMING</span><h2>Bookings</h2></div><span className="student-card-icon">◷</span></div><div className="student-detail-empty"><div>◷</div><h3>No upcoming sessions</h3><p>Confirmed mock interview and cohort booking details will appear here.</p><a href="/mock-interview">Explore mock interview practice →</a></div></article>
          <article className="student-detail-card" id="student-4"><div className="student-section-heading compact"><div><span className="student-kicker">YOUR ACHIEVEMENTS</span><h2>Certificates</h2></div><span className="student-card-icon violet">✧</span></div><div className="student-certificate-empty"><div className="certificate-shape">✧</div><h3>Your achievements will live here</h3><p>Complete an enrolled program to earn and access certificates.</p><span className="certificate-status">0 CERTIFICATES EARNED</span></div></article>
        </section>
        <footer className="student-footer"><span>© 2026 Adyant Associates</span><div><a href="/support">Help &amp; support</a><a href="/privacy">Privacy</a></div></footer>
      </div>
    </main>
  </div>;
}

function ProgramCard({ program, cohort }) {
  return <article className="student-program-card"><div className="student-program-art"><span>AA</span><small>{program.type || 'LEARNING PROGRAM'}</small></div><div className="student-program-body"><div className="student-program-status"><span className="catalog-available">AVAILABLE</span><small>{program.format}</small></div><h3>{program.title}</h3><p>{descriptions[program.id] || 'Explore the details and learning outcomes for this program.'}</p><div className="student-program-meta"><span>{cohort ? `Next start ${cohort.start_date}` : 'Flexible access'}</span><span>Explore before enrolling</span></div><a href="/membership">View program details <b>→</b></a></div></article>;
}

function VideoFrame({ video }) {
  return <div className="student-video-frame">{video.url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? <video controls src={video.url} /> : <iframe src={video.url} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}</div>;
}

export default StudentPortal;
