import { useState } from 'react';
import './support.css';
import SiteNav from './site-nav';
import { useSearchTarget } from './search-navigation';
import { apiRequest } from './api';

const SUPPORT_EMAIL = 'akashrbhat73@gmail.com';
const courses = [
  'AI for QA Managers',
  'Interview Preparation Guide',
  'Ready Mock Preparation',
];

const initialMessages = [
  {
    from: 'bot',
    text: 'Hi! I can help you find a program or point you to the right support. What would you like to know?',
  },
];

function findCourse(question) {
  const normalizedQuestion = question.toLowerCase();
  return courses.find((course) =>
    course.toLowerCase().split(' ').some((word) => word.length > 3 && normalizedQuestion.includes(word)),
  );
}

function Chatbot() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;
    setError('');
    try {
      await apiRequest('/support', {
        method: 'POST',
        body: JSON.stringify({ question: trimmedQuestion }),
      });
    } catch (requestError) {
      setError(requestError.message);
      return;
    }

    const matchedCourse = findCourse(trimmedQuestion);
    const asksAboutCourses = /course|program|class|training|learn|syllabus/i.test(trimmedQuestion);
    const answer = matchedCourse
      ? `I found ${matchedCourse} in our programs. I’ll take you to the courses page so you can explore it.`
      : asksAboutCourses
        ? `I couldn't find that course in our current programs. For better support, please email ${SUPPORT_EMAIL} and a real person will help you.`
        : `For better support with that question, please email ${SUPPORT_EMAIL}. A real person will get back to you.`;

    setMessages((currentMessages) => [
      ...currentMessages,
      { from: 'user', text: trimmedQuestion },
      { from: 'bot', text: answer, courseLink: Boolean(matchedCourse) },
    ]);
    setQuestion('');
    if (matchedCourse) {
      window.setTimeout(() => {
        window.location.href = '/#courses';
      }, 350);
    }
  }

  return (
    <section className="support-chat" id="support-chat" aria-labelledby="chat-title" tabIndex={-1}>
      <div className="support-chat-heading">
        <div>
          <span className="support-label">Quick help</span>
          <h2 id="chat-title">Ask our support chatbot</h2>
        </div>
        <span className="chat-status"><i /> Online</span>
      </div>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`chat-message ${message.from}`} key={`${message.from}-${index}`}>
            <span className="chat-avatar">{message.from === 'bot' ? 'A' : 'You'}</span>
            <div>
              <p>{message.text}</p>
              {message.courseLink && <a className="chat-course-link" href="/#courses">View courses →</a>}
            </div>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <label htmlFor="support-question">Your question</label>
        <div>
          <input
            id="support-question"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about a course or anything else..."
            value={question}
          />
          <button className="dark-button" type="submit">Send</button>
        </div>
      </form>
      {error && <p className="field-help" role="alert">{error}</p>}
    </section>
  );
}

function Support() {
  useSearchTarget();
  return (
    <div className="support-page">
      <SiteNav active="support" coursesHref="/membership#curriculum" mockHref="/#batches" ctaHref={`mailto:${SUPPORT_EMAIL}`} ctaLabel="Email support" showCta />

      <main>
        <section className="support-hero" id="support-hero" tabIndex={-1}>
          <span className="support-label">Support desk / Privacy</span>
          <h1>Clear answers, thoughtful support.</h1>
          <p>Use the chatbot for quick guidance, or contact a real person whenever you need more help with Adyant Associates.</p>
          <a className="support-email" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL} ↗</a>
        </section>

        <div className="support-layout">
          <Chatbot />
          <aside className="privacy-card">
            <span className="support-label">Privacy promise</span>
            <h2>Your questions stay private.</h2>
            <p>We use the information you share only to respond to your request and improve your support experience.</p>
            <ul>
              <li>No account is required to use this chatbot.</li>
              <li>We do not sell your questions or contact details.</li>
              <li>Email support is handled by a real person.</li>
            </ul>
            <div className="privacy-contact">
              <strong>Need personal help?</strong>
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </div>
          </aside>
        </div>
      </main>

      <footer className="support-footer">
        <span>© 2026 Adyant Associates</span>
        <a href="/">Back to home</a>
      </footer>
    </div>
  );
}

export default Support;
