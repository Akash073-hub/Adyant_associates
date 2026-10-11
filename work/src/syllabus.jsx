import './syllabus.css';

function Syllabus() {
  return (
    <div className="syllabus-page">
      <header className="syllabus-header">
        <a className="syllabus-brand" href="/">Adyant AI QA</a>
        <a className="syllabus-back" href="/">← Back to courses</a>
      </header>

      <main className="syllabus-content">
        <span className="syllabus-label">AI FOR QA MANAGERS // SYLLABUS</span>
        <h1>AI for Software Testers: GenAI, AI Agents, MCP &amp; N8N</h1>
        <p className="syllabus-source">Reference course: Udemy</p>

        <section className="syllabus-card">
          <h2>Course syllabus</h2>
          <p>
            Explore practical applications of generative AI, AI agents, MCP,
            and N8N automation for modern software testing workflows.
          </p>
          <div className="syllabus-topics">
            <p>✓ Generative AI fundamentals for software testers</p>
            <p>✓ AI-assisted test design and test case generation</p>
            <p>✓ Building practical AI agent workflows</p>
            <p>✓ Model Context Protocol (MCP) concepts and usage</p>
            <p>✓ N8N automation workflows for QA teams</p>
          </div>
          <a className="syllabus-button" href="/">Back to course programs</a>
        </section>
      </main>
    </div>
  );
}

export default Syllabus;
