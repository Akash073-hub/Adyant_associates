import { useEffect, useRef, useState } from 'react';
import './membership.css';
import SiteNav from './site-nav';
import { focusSearchTarget, getSearchQuery } from './search-navigation';
import { apiRequest } from './api';
import { suppliedClassVideos } from './class-videos';

const faqs = [
  ['Which program should I start with?', 'Browse the current catalog above and choose the format and subject that best fit your goals.'],
  ['How does mock interview booking work?', 'Select the mock interview option, complete the secure booking flow, and receive the session details and preparation guidance.'],
  ['Do I need to complete more than one program?', 'No. Programs stand alone. Choose the one that matches your current goal, or combine preparation with a mock session.'],
  ['Can teams use these programs?', 'Yes. Contact support to discuss access for QA managers and quality teams preparing for AI adoption or interviews.'],
];

function Membership() {
  const [playing, setPlaying] = useState(false);
  const [videos, setVideos] = useState(suppliedClassVideos);
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(suppliedClassVideos[0] || null);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [playRequestId, setPlayRequestId] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const query = getSearchQuery();
    if (query) setSearch(query);
  }, []);
  useEffect(() => {
    focusSearchTarget(search);
  }, [search]);
  useEffect(() => {
    apiRequest('/videos')
      .then((result) => {
        const apiVideos = [...(result.videos || [])].reverse();
        const combined = [...apiVideos, ...suppliedClassVideos];
        setVideos(combined);
        setActiveVideo(combined[0] || null);
      })
      .catch(() => {
        setVideos(suppliedClassVideos);
        setActiveVideo(suppliedClassVideos[0] || null);
      });
  }, []);
  useEffect(() => {
    apiRequest('/programs')
      .then((catalog) => {
        setPrograms(catalog.programs || []);
        setCohorts(catalog.cohorts || []);
      })
      .catch(() => { setPrograms([]); setCohorts([]); })
      .finally(() => setCatalogLoading(false));
  }, []);

  const recentVideo = videos[0] || null;
  const previousClassVideo =
    videos.find((video) => video.id === 'previous-class') || videos[1] || recentVideo;

  function handleClassroomPreview() {
    setShowAllVideos((current) => !current);
  }

  function handlePlayPreviousClass() {
    if (!previousClassVideo) return;
    setActiveVideo(previousClassVideo);
    setPlaying(true);
    setPlayRequestId((count) => count + 1);
  }

  function handleSelectVideo(video) {
    setActiveVideo(video);
    setPlaying(Boolean(video));
    if (video) {
      setPlayRequestId((count) => count + 1);
    }
  }

  const visibleTracks = programs.filter((program) =>
    `${program.title} ${program.description} ${program.type} ${(program.highlights || []).join(' ')}`.toLowerCase().includes(search.toLowerCase()),
  );
  return <div className="courses-page">
    <SiteNav active="memberships" coursesHref="/membership#curriculum" mockHref="/mock-interview" ctaHref="/checkout" searchValue={search} onSearchChange={(event) => setSearch(event.target.value)} />
    <main id="top">
      <section className="courses-hero"><div className="courses-inner"><div className="courses-tag"><span /> {'// QA LEADERSHIP & INTERVIEW SUPPORT'}</div><h1>Focused preparation.<br /><em>Confident performance.</em></h1><p>Explore the current programs for QA managers and quality engineers, with focused learning and interview practice.</p><div className="course-metrics"><Metric label="PROGRAMS" value={String(programs.length)} text="Focused offerings" /><Metric label="COHORTS" value={String(cohorts.length)} text="Scheduled sessions" /><Metric label="GUIDANCE" value="100%" text="Action-oriented" /><Metric label="BOOKING" value={cohorts.some((cohort) => cohort.status === 'open' && cohort.seats_available > 0) ? 'OPEN' : 'CLOSED'} text="Session availability" /></div></div></section>
      <section className="courses-section pedagogy-section" id="pedagogy"><SectionIntro label="01 // PEDAGOGICAL FRAMEWORK — HOW WE TEACH" title="Engineering Rigor Over Superficial Tutorials" text="We bridge the gap between superficial tutorial scripts and resilient enterprise frameworks through focused, practical programs." /><div className="principles-grid">{programs.map((program, index) => <article className={`principle principle-${index}`} key={program.id}><span className="principle-label">PROGRAM {String(index + 1).padStart(2, '0')} {'·'} {program.type}</span><h3>{program.title}</h3><p>{program.description}</p><footer>⌁ {(program.highlights || []).join(' • ')}</footer></article>)}</div></section>
      <section className="courses-section curriculum-section" id="curriculum"><div className="section-rule"><SectionIntro label="02 // PROGRAMS" title="Focused ways to move forward" /><p>● Clear guidance + practical preparation + mock interview booking</p></div><div className="track-heading"><b>AVAILABLE NOW</b><h3>Our programs</h3></div>{catalogLoading ? <p>Loading programs…</p> : <div className="active-track-grid">{visibleTracks.map((program, index) => <TrackCard program={program} index={index} key={program.id} />)}</div>}{!catalogLoading && visibleTracks.length === 0 && <p>No programs match “{search}”.</p>}</section>
      <section className="courses-section classroom-section" id="classroom-preview">
        <div className="classroom-header-row">
          <SectionIntro label="03 // PREVIEW" title="See how focused preparation works" text="Preview a practical session built around clear examples, realistic interview prompts, and direct feedback." />
          <div className="classroom-action-bar">
            <button
              className={`classroom-action-btn ${showAllVideos ? 'active' : ''}`}
              type="button"
              onClick={handleClassroomPreview}
            >
              {showAllVideos ? 'Hide Classroom Preview' : 'Classroom Preview'}
            </button>
            <button
              className={`classroom-action-btn primary ${activeVideo?.id === previousClassVideo?.id && playRequestId > 0 ? 'active' : ''}`}
              type="button"
              onClick={handlePlayPreviousClass}
            >
              ▶ Previous Class
            </button>
          </div>
        </div>
        <div className="classroom-grid">
          <VideoPreview
            video={activeVideo}
            isRecent={Boolean(activeVideo && recentVideo && activeVideo.id === recentVideo.id)}
            isPreviousClass={Boolean(activeVideo && previousClassVideo && activeVideo.id === previousClassVideo.id)}
            playing={playing}
            playRequestId={playRequestId}
            onToggle={() => setPlaying(!playing)}
          />
          <ChapterList
            videos={videos}
            recentVideo={recentVideo}
            activeVideo={activeVideo}
            showAllVideos={showAllVideos}
            onToggleAllVideos={handleClassroomPreview}
            onSelectVideo={handleSelectVideo}
          />
        </div>
      </section>
      <section className="courses-section faq-section" id="faq"><SectionIntro label="04 // PROGRAM FAQs" title="Frequently Addressed Inquiries" text="Clear answers about choosing a program, preparing for interviews, and booking your mock session." /><div className="faq-list">{faqs.map(([question, answer], index) => <details open={index === 0} key={question}><summary>{question}<b>⌄</b></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="courses-footer"><div><a className="courses-brand" href="/home"><span /> Adyant Associates</a><small>© 2026 Adyant Associates. All rights reserved.</small></div><nav><a href="/support">Privacy Policy</a><a href="#faq">Terms of Service</a></nav></footer>
  </div>;
}

function Metric({ label, value, text }) { return <div><span>{label}</span><strong>{value}</strong><p>{text}</p></div>; }
function SectionIntro({ label, title, text }) { return <div className="section-intro"><span>{label}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>; }
function TrackCard({ program, index }) {
  const featured = program.featured;
  const statusLabel = program.status === 'coming_soon' ? 'Coming soon' : 'Available now';
  const id = `track-${program.id}`;
  const isEnrollmentProgram = ['ai-for-qa-managers', 'interview-preparation-guide'].includes(program.id);
  const actionLabel = isEnrollmentProgram ? 'Enroll' : (program.action_label || 'Enroll now');
  const actionUrl = isEnrollmentProgram ? '/checkout' : (program.action_url || '/checkout');
  return <article className={`track-card ${featured ? 'featured-track' : ''}`} id={id} tabIndex={-1}>
    {featured && <b className="track-ribbon">FEATURED PROGRAM</b>}
    <div><div className="track-meta"><span className={featured ? 'blue-text' : ''}>PROGRAM #{String(index + 1).padStart(2, '0')}</span><b>{statusLabel}</b></div><h4>{program.title}</h4><p>{program.description}</p><div className="tag-list">{(program.highlights || []).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
    <footer><div><strong>{program.price_label}</strong><small>{program.format}</small></div><a href={actionUrl}>{actionLabel} →</a></footer>
  </article>;
}
function VideoPreview({ video, isRecent, isPreviousClass, playing, playRequestId, onToggle }) {
  const videoRef = useRef(null);
  const shouldAutoPlay = playRequestId > 0;
  const embedUrl = video ? getEmbedUrl(video.url, shouldAutoPlay) : null;

  useEffect(() => {
    if (!shouldAutoPlay || !videoRef.current) return;
    videoRef.current.currentTime = 0;
    const promise = videoRef.current.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {});
    }
  }, [video?.url, playRequestId, shouldAutoPlay]);

  const badgeText = video
    ? (isRecent ? 'RECENTLY ADDED' : isPreviousClass ? 'PREVIOUS CLASS' : 'CLASS RECORDING')
    : (playing ? 'PLAYING' : 'TRIAL PREVIEW');

  return <div className="video-player">
    <div className="video-titlebar"><span>● ● ●　{video?.title || 'Trial Video'}</span><b>{badgeText}</b></div>
    <div className={`video-screen ${video ? 'has-selected-video' : ''}`}>
      {video ? (embedUrl
        ? <iframe key={`${video.id}-${playRequestId}`} className="membership-video-embed" src={embedUrl} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        : <video ref={videoRef} key={video.url} className="membership-video-file" controls autoPlay={shouldAutoPlay} src={video.url}>{video.title}</video>)
        : <><div className="code-preview"><span>{'// Interview preparation session'}</span><p><b>Question</b>: Tell us about your QA leadership approach.</p><p><b>Framework</b>: Context → Action → Result → Learning</p><p><b>Feedback</b>: Clear, specific, and actionable.</p><p><b>Next step</b>: Rehearse your strongest example.</p></div><div className="terminal-output">[MOCK-SESSION] Interview prompts loaded.<br />[FEEDBACK] Response structure reviewed | Next steps ready.</div><div className="faculty-cam"><span>● COACH CAM</span><strong>QA</strong><b>Interview Coach</b><small>Practical feedback</small></div><button className={`play-button ${playing ? 'is-playing' : ''}`} onClick={onToggle} type="button">{playing ? 'Ⅱ' : '▶'}</button></>}
    </div>
    {!video && <div className="video-controls"><div className="progress"><span /></div><div><span>Ⅱ　↶ 10　↷ 10　 08:24 / 24:10</span><span>1.25x　♬　▣　⚙　⛶</span></div></div>}
  </div>;
}
function getEmbedUrl(rawUrl, autoplay = false) {
  try {
    const url = new URL(rawUrl);
    const suffix = autoplay ? '?autoplay=1' : '';
    if (url.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}${suffix}`;
    if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
      const segments = url.pathname.split('/').filter(Boolean);
      const id = url.pathname === '/watch' ? url.searchParams.get('v') : segments[segments.length - 1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}${suffix}` : null;
    }
    if (url.hostname === 'vimeo.com' || url.hostname.endsWith('.vimeo.com')) {
      const segments = url.pathname.split('/').filter(Boolean);
      const id = segments[segments.length - 1];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}${suffix}` : null;
    }
  } catch (_) {
    return null;
  }
  return null;
}
function ChapterList({ videos, recentVideo, activeVideo, showAllVideos, onToggleAllVideos, onSelectVideo }) {
  const chapters = [['00:00 - 05:12', 'Set your interview target', 'Clarify the role, expectations, and examples you need to prepare.'], ['05:13 - 12:40 [NOW PLAYING]', 'Build strong answer frameworks', 'Turn your experience into concise, confident, evidence-based answers.'], ['12:41 - 18:15', 'Practice difficult questions', 'Work through leadership, conflict, and quality strategy prompts.'], ['18:16 - 24:10', 'Plan your next improvements', 'Leave with direct feedback and a short rehearsal plan.']];
  return <aside className="chapter-list">
    <div className="chapter-heading">
      <span>{showAllVideos ? 'CLASSROOM PREVIEW · ALL VIDEOS' : 'RECENTLY ADDED VIDEO'}</span>
      <h3>{showAllVideos ? 'Choose a video' : 'Now featured'} <b>{videos.length + 1} videos</b></h3>
    </div>
    <div className="membership-video-list">
      {showAllVideos ? (
        <>
          {videos.map((video, index) => (
            <button className={activeVideo?.id === video.id ? 'selected' : ''} key={video.id} onClick={() => onSelectVideo(video)} type="button">
              <strong>{video.title}{index === 0 ? ' · Latest' : ''}</strong>
              <span>{video.date || video.created_date || 'Class recording'}</span>
            </button>
          ))}
          <button className={!activeVideo ? 'selected' : ''} onClick={() => onSelectVideo(null)} type="button">
            <strong>Trial Video</strong>
            <span>Sample interview preparation preview</span>
          </button>
        </>
      ) : (
        <>
          {recentVideo && (
            <button className={activeVideo?.id === recentVideo.id ? 'selected' : ''} onClick={() => onSelectVideo(recentVideo)} type="button">
              <strong>{recentVideo.title}</strong>
              <span>Recently added · {recentVideo.date || recentVideo.created_date || 'Latest class recording'}</span>
            </button>
          )}
          <button className="classroom-show-all-link" type="button" onClick={onToggleAllVideos}>
            <strong>View all {videos.length + 1} videos in Classroom Preview →</strong>
            <span>Browse all class recordings and trial previews</span>
          </button>
        </>
      )}
    </div>
    <div className="chapter-heading chapter-subheading"><span>PREPARATION BREAKDOWN</span><h3>Key Concepts &amp; Timestamps <b>4 Chapters</b></h3></div>
    {chapters.map(([time, title, text], index) => <article className={index === 1 && !activeVideo ? 'current' : ''} key={time}><span>{time}</span><h4>{title}</h4><p>{text}</p></article>)}
    <div className="audit-note">✓ <span><b>Actionable feedback included</b><small>Every session ends with clear next steps for improvement.</small></span></div>
  </aside>;
}
export default Membership;
