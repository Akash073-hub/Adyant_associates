import { useEffect, useState } from 'react';
import './membership.css';
import SiteNav from './site-nav';
import { focusSearchTarget, getSearchQuery } from './search-navigation';
import { apiRequest } from './api';

const principles = [
  ['01 // AI LEADERSHIP', 'AI for QA Managers', 'Learn how to introduce AI into quality workflows with practical governance, adoption planning, and measurable team outcomes.', 'AI strategy • Governance • Team enablement'],
  ['02 // INTERVIEW PLAN', 'Interview Preparation Guide', 'Follow a focused preparation system for QA leadership and automation interviews, from role research to confident storytelling.', 'Role targeting • Question banks • Answer frameworks'],
  ['03 // MOCK PRACTICE', 'Ready Mock Preparation', 'Turn preparation into performance with a live mock interview, direct feedback, and a prioritized improvement plan.', 'Live interview • Feedback • Action plan'],
];

const tracks = [
  ['PROGRAM #01', 'Available now', 'AI for QA Managers', 'A practical guide to leading AI adoption in QA, with governance, team workflows, and implementation checkpoints.', 'Start', 'Self-paced guidance', ['AI strategy', 'Responsible adoption', 'Team playbooks'], true],
  ['PROGRAM #02', 'Available now', 'Interview Preparation Guide', 'A structured plan for preparing strong QA manager and automation interview answers, examples, and questions.', 'Start', 'Self-paced guidance', ['Role research', 'Answer frameworks', 'Practice plan']],
  ['PROGRAM #03', 'Book a live interview', 'Ready Mock Preparation', 'A live mock interview with direct feedback so you know exactly what to improve before interview day.', 'Book', 'Live mock interview', ['Mock questions', 'Expert feedback', 'Next steps']],
];

const faqs = [
  ['Which program should I start with?', 'Choose AI for QA Managers for leadership guidance, Interview Preparation Guide for structured study, or Ready Mock Preparation when you want realistic practice and feedback.'],
  ['How does mock interview booking work?', 'Select the mock interview option, complete the secure booking flow, and receive the session details and preparation guidance.'],
  ['Do I need to complete all three programs?', 'No. Each program stands alone. Choose the one that matches your current goal, or combine preparation guidance with a mock session.'],
  ['Can teams use these programs?', 'Yes. Contact support to discuss access for QA managers and quality teams preparing for AI adoption or interviews.'],
];

function Membership() {
  const [playing, setPlaying] = useState(false);
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
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
      .then((result) => setVideos(result.videos))
      .catch(() => setVideos([]));
  }, []);
  const visibleTracks = tracks.filter(([, , title, text, , , tags]) =>
    `${title} ${text} ${tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()),
  );
  return <div className="courses-page">
    <SiteNav active="memberships" coursesHref="/membership#curriculum" mockHref="/home#batches" ctaHref="/checkout" searchValue={search} onSearchChange={(event) => setSearch(event.target.value)} />
    <main id="top">
      <section className="courses-hero"><div className="courses-inner"><div className="courses-tag"><span /> {'// QA LEADERSHIP & INTERVIEW SUPPORT'}</div><h1>Focused preparation.<br /><em>Confident performance.</em></h1><p>Choose from three focused programs designed to help QA managers and quality engineers lead with AI, prepare for interviews, and practice with expert feedback.</p><div className="course-metrics"><Metric label="PROGRAMS" value="3" text="Focused offerings" /><Metric label="PRACTICE" value="1:1" text="Mock interview support" /><Metric label="GUIDANCE" value="100%" text="Action-oriented" /><Metric label="BOOKING" value="OPEN" text="Reserve your mock" /></div></div></section>
      <section className="courses-section pedagogy-section" id="pedagogy"><SectionIntro label="01 // PEDAGOGICAL FRAMEWORK — HOW WE TEACH" title="Engineering Rigor Over Superficial Tutorials" text="We bridge the gap between superficial tutorial scripts and resilient enterprise frameworks through five core architectural disciplines." /><div className="principles-grid">{principles.map(([label, title, text, footer], index) => <article className={`principle principle-${index}`} key={title}><span className="principle-label">{label}</span><h3>{title}</h3><p>{text}</p><footer>⌁ {footer}</footer></article>)}</div></section>
      <section className="courses-section curriculum-section" id="curriculum"><div className="section-rule"><SectionIntro label="02 // PROGRAMS" title="Three focused ways to move forward" /><p>● Clear guidance + practical preparation + mock interview booking</p></div><div className="track-heading"><b>AVAILABLE NOW</b><h3>Our programs</h3></div><div className="active-track-grid">{visibleTracks.map((track) => <TrackCard track={track} key={track[0]} />)}</div>{visibleTracks.length === 0 && <p>No programs match “{search}”.</p>}</section>
      <section className="courses-section classroom-section" id="classroom-preview"><SectionIntro label="03 // PREVIEW" title="See how focused preparation works" text="Preview a practical session built around clear examples, realistic interview prompts, and direct feedback." /><div className="classroom-grid"><VideoPreview video={activeVideo} playing={playing} onToggle={() => setPlaying(!playing)} /><ChapterList videos={videos} activeVideo={activeVideo} onSelectVideo={(video) => { setActiveVideo(video); setPlaying(false); }} /></div></section>
      <section className="courses-section faq-section" id="faq"><SectionIntro label="04 // PROGRAM FAQs" title="Frequently Addressed Inquiries" text="Clear answers about choosing a program, preparing for interviews, and booking your mock session." /><div className="faq-list">{faqs.map(([question, answer], index) => <details open={index === 0} key={question}><summary>{question}<b>⌄</b></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="courses-footer"><div><a className="courses-brand" href="/home"><span /> Adyant Associates</a><small>© 2026 Adyant Associates. All rights reserved.</small></div><nav><a href="/support">Privacy Policy</a><a href="#faq">Terms of Service</a></nav></footer>
  </div>;
}

function Metric({ label, value, text }) { return <div><span>{label}</span><strong>{value}</strong><p>{text}</p></div>; }
function SectionIntro({ label, title, text }) { return <div className="section-intro"><span>{label}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>; }
function TrackCard({ track }) { const [code, status, title, text, price, detail, tags, featured] = track; const id = `track-${title.toLowerCase().replaceAll(' ', '-')}`; return <article className={`track-card ${featured ? 'featured-track' : ''}`} id={id} tabIndex={-1}>{featured && <b className="track-ribbon">FLAGSHIP TRACK // 80 HRS</b>}<div><div className="track-meta"><span className={featured ? 'blue-text' : ''}>{code}</span><b>{status}</b></div><h4>{title}</h4><p>{text}</p><div className="tag-list">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><footer><div><strong>{price}</strong><small>{detail}</small></div><a href="/checkout">Enroll Now →</a></footer></article>; }
function VideoPreview({ video, playing, onToggle }) {
  const embedUrl = video ? getEmbedUrl(video.url) : null;
  return <div className="video-player">
    <div className="video-titlebar"><span>● ● ●　{video?.title || 'Trial Video'}</span><b>{video ? 'MEMBERSHIP VIDEO' : playing ? 'PLAYING' : 'TRIAL PREVIEW'}</b></div>
    <div className={`video-screen ${video ? 'has-selected-video' : ''}`}>
      {video ? (embedUrl
        ? <iframe className="membership-video-embed" src={embedUrl} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        : <video className="membership-video-file" controls src={video.url}>{video.description || video.title}</video>)
        : <><div className="code-preview"><span>{'// Interview preparation session'}</span><p><b>Question</b>: Tell us about your QA leadership approach.</p><p><b>Framework</b>: Context → Action → Result → Learning</p><p><b>Feedback</b>: Clear, specific, and actionable.</p><p><b>Next step</b>: Rehearse your strongest example.</p></div><div className="terminal-output">[MOCK-SESSION] Interview prompts loaded.<br />[FEEDBACK] Response structure reviewed | Next steps ready.</div><div className="faculty-cam"><span>● COACH CAM</span><strong>QA</strong><b>Interview Coach</b><small>Practical feedback</small></div><button className={`play-button ${playing ? 'is-playing' : ''}`} onClick={onToggle} type="button">{playing ? 'Ⅱ' : '▶'}</button></>}
    </div>
    {!video && <div className="video-controls"><div className="progress"><span /></div><div><span>Ⅱ　↶ 10　↷ 10　 08:24 / 24:10</span><span>1.25x　♬　▣　⚙　⛶</span></div></div>}
  </div>;
}
function getEmbedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
      const segments = url.pathname.split('/').filter(Boolean);
      const id = url.pathname === '/watch' ? url.searchParams.get('v') : segments[segments.length - 1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.hostname === 'vimeo.com' || url.hostname.endsWith('.vimeo.com')) {
      const segments = url.pathname.split('/').filter(Boolean);
      const id = segments[segments.length - 1];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch (_) {
    return null;
  }
  return null;
}
function ChapterList({ videos, activeVideo, onSelectVideo }) {
  const chapters = [['00:00 - 05:12', 'Set your interview target', 'Clarify the role, expectations, and examples you need to prepare.'], ['05:13 - 12:40 [NOW PLAYING]', 'Build strong answer frameworks', 'Turn your experience into concise, confident, evidence-based answers.'], ['12:41 - 18:15', 'Practice difficult questions', 'Work through leadership, conflict, and quality strategy prompts.'], ['18:16 - 24:10', 'Plan your next improvements', 'Leave with direct feedback and a short rehearsal plan.']];
  return <aside className="chapter-list">
    <div className="chapter-heading"><span>TRIAL VIDEO LIBRARY</span><h3>Choose a video <b>{videos.length + 1} videos</b></h3></div>
    <div className="membership-video-list">
      <button className={!activeVideo ? 'selected' : ''} onClick={() => onSelectVideo(null)} type="button"><strong>Trial Video</strong><span>Sample interview preparation preview</span></button>
      {videos.map((video) => <button className={activeVideo?.id === video.id ? 'selected' : ''} key={video.id} onClick={() => onSelectVideo(video)} type="button"><strong>{video.title}</strong><span>{video.description || 'Open membership video'}</span></button>)}
    </div>
    <div className="chapter-heading chapter-subheading"><span>PREPARATION BREAKDOWN</span><h3>Key Concepts &amp; Timestamps <b>4 Chapters</b></h3></div>
    {chapters.map(([time, title, text], index) => <article className={index === 1 && !activeVideo ? 'current' : ''} key={time}><span>{time}</span><h4>{title}</h4><p>{text}</p></article>)}
    <div className="audit-note">✓ <span><b>Actionable feedback included</b><small>Every session ends with clear next steps for improvement.</small></span></div>
  </aside>;
}
export default Membership;
