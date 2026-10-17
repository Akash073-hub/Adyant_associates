import { useEffect } from 'react';

const COURSE_TARGETS = [
  { slug: 'ai-for-qa-managers', title: 'AI for QA Managers', aliases: ['ai for qa', 'ai qa', 'qa managers', 'artificial intelligence'] },
  { slug: 'interview-preparation-guide', title: 'Interview Preparation Guide', aliases: ['interview', 'interviews', 'preparation', 'qa manager interview'] },
  { slug: 'ready-mock-preparation', title: 'Ready Mock Preparation', aliases: ['mock', 'mock interview', 'practice', 'feedback'] },
];

const STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'for', 'from', 'how', 'i', 'in', 'is',
  'it', 'me', 'of', 'on', 'our', 'please', 'the', 'this', 'to', 'what',
  'where', 'which', 'with', 'you', 'your',
]);

const SECTION_TARGETS = [
  { path: '/', id: 'courses', terms: ['course', 'courses', 'program', 'programs', 'learn', 'resource', 'next step', 'offering'] },
  { path: '/', id: 'batches', terms: ['mock', 'booking', 'batch', 'session', 'schedule', 'mentor', 'cohort'] },
  { path: '/', id: 'social-proof', terms: ['review', 'reviews', 'testimonial', 'testimonials', 'customer', 'company', 'trust', 'experience', 'success', 'community'] },
  { path: '/', id: 'support', terms: ['support', 'guidance', 'career', 'help', 'leadership', 'quality'] },
  { path: '/', id: 'membership', terms: ['assessment', 'diagnostic', 'readiness', 'roadmap', 'skill gap'] },
  { path: '/membership', id: 'pedagogy', terms: ['framework', 'teach', 'teaching', 'method', 'principle', 'rigor', 'architecture'] },
  { path: '/membership', id: 'curriculum', terms: ['course', 'courses', 'program', 'programs', 'enroll', 'offering', 'guidance'] },
  { path: '/membership', id: 'classroom-preview', terms: ['preview', 'lesson', 'prepare', 'preparation', 'interview', 'practice', 'feedback'] },
  { path: '/membership', id: 'faq', terms: ['faq', 'question', 'answer', 'inquiry', 'booking', 'teams'] },
  { path: '/support', id: 'support-chat', terms: ['support', 'help', 'contact', 'question', 'chat', 'privacy'] },
  { path: '/support', id: 'support-hero', terms: ['company', 'privacy', 'person', 'email'] },
  { path: '/syllabus/ai-for-qa-managers', id: 'syllabus-course', terms: ['syllabus', 'topic', 'generative', 'agent', 'mcp', 'n8n', 'testing', 'automation'] },
  { path: '/reset-credentials', id: 'credential-recovery', terms: ['reset', 'credential', 'password', 'login', 'email', 'account', 'purchase'] },
];

function meaningfulWords(query) {
  return query.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !STOP_WORDS.has(word)) || [];
}

function scoreSection(query, section) {
  const normalized = query.toLowerCase();
  const words = meaningfulWords(query);
  return section.terms.reduce((score, term) => {
    if (normalized.includes(term)) return score + (term.includes(' ') ? 3 : 1);
    return score + (words.includes(term) ? 1 : 0);
  }, 0);
}

function findSection(query, path) {
  return SECTION_TARGETS
    .filter((section) => section.path === path)
    .map((section) => ({ section, score: scoreSection(query, section) }))
    .sort((a, b) => b.score - a.score)[0]?.score > 0
    ? SECTION_TARGETS.filter((section) => section.path === path)
      .map((section) => ({ section, score: scoreSection(query, section) }))
      .sort((a, b) => b.score - a.score)[0].section
    : null;
}

function findBestSection(query, excludedPath) {
  const best = SECTION_TARGETS
    .filter((section) => section.path !== excludedPath)
    .map((section) => ({ section, score: scoreSection(query, section) }))
    .sort((a, b) => b.score - a.score)[0];
  return best?.score > 0 ? best.section : null;
}

function matchesCourse(query, course) {
  const normalized = query.toLowerCase();
  return normalized.includes(course.title.toLowerCase()) || course.aliases.some((alias) => normalized.includes(alias));
}

export function navigateToSearch(query) {
  const trimmed = query.trim();
  if (!trimmed) return;

  const path = window.location.pathname;
  const course = COURSE_TARGETS.find((item) => matchesCourse(trimmed, item));
  const currentSection = findSection(trimmed, path);
  const globalSection = findBestSection(trimmed, path);
  let destination = path;
  let target = '';

  if (course && path === '/') target = `course-${course.slug}`;
  else if (course && path === '/membership') target = `track-${course.slug}`;
  else if (course && path === '/syllabus/ai-for-qa-managers') target = 'syllabus-course';
  else if (course) {
    destination = course.slug === 'ai-for-qa-managers' ? '/syllabus/ai-for-qa-managers' : '/membership';
    target = course.slug === 'ai-for-qa-managers' ? 'syllabus-course' : `track-${course.slug}`;
  } else if (currentSection) {
    target = currentSection.id;
  } else if (globalSection) {
    destination = globalSection.path;
    target = globalSection.id;
  } else if (meaningfulWords(trimmed).length > 0) {
    destination = '/';
    target = 'courses';
  }

  const params = new URLSearchParams({ search: trimmed });
  window.location.href = `${destination}?${params.toString()}${target ? `#${target}` : ''}`;
}

export function focusSearchTarget(search) {
  if (!search) return;
  const targetId = window.location.hash.slice(1);
  if (!targetId) return;
  const target = document.getElementById(targetId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.focus({ preventScroll: true });
  target.classList.add('search-target');
  window.setTimeout(() => target.classList.remove('search-target'), 2200);
}

export function getSearchQuery() {
  return new URLSearchParams(window.location.search).get('search') || '';
}

export function useSearchTarget() {
  const search = getSearchQuery();
  useEffect(() => {
    focusSearchTarget(search);
  }, [search]);
}
