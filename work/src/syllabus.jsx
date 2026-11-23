import { useState } from 'react';
import { useSearchTarget } from './search-navigation';
import './syllabus.css';
import SiteNav from './site-nav';

const SYLLABUS_SECTIONS = [
  {
    id: 'foundations-genai-qa',
    title: 'Foundations of Generative AI for QA',
    items: [
      {
        type: 'video',
        title: 'How GenAI, AI Agents, and MCP Transform Modern Testing',
        description:
          'See how modern QA teams combine generative models, autonomous agents, and protocol-based tool integrations to speed up test data creation, script authoring, execution, and reporting.',
      },
      {
        type: 'video',
        title: 'Core Concepts of Generative AI & Large Language Models',
        description:
          'Understand how transformer-based models process text, code, and media through tokenization and context windows to produce reliable engineering outputs.',
      },
      {
        type: 'video',
        title: 'Model Inference, Fine-Tuning, and Prompt Engineering',
        description:
          'Learn how model behavior is shaped at inference time versus fine-tuning, and when structured prompting is the fastest way to tailor results for QA tasks.',
      },
      {
        type: 'video',
        title: 'Practical Prompting Techniques for QA Engineers',
        description:
          'Apply zero-shot, one-shot, few-shot, and step-by-step reasoning prompts to design accurate test cases, troubleshoot flaky scripts, and scaffold frameworks.',
      },
      {
        type: 'video',
        title: 'Building a Complete Automation Framework with Prompting',
        description:
          'Walk through creating a structured Java 17 and Playwright automation project from scratch—including Page Object Model, Maven, logging, data-driven Excel support, and cross-browser runs.',
      },
      {
        type: 'video',
        title: 'Selecting the Right AI Model for Each Engineering Task',
        description:
          'Compare leading models across complex coding, day-to-day IDE assistance, technical documentation, and visual analysis so your team chooses the right tool for the job.',
      },
      {
        type: 'video',
        title: 'GenAI vs. AI Workflows vs. AI Agents vs. Agentic AI',
        description:
          'Clarify the architectural differences between single-turn generation, deterministic tool workflows, autonomous agents, and coordinated multi-agent systems.',
      },
    ],
  },
  {
    id: 'ai-powered-testing',
    title: 'AI-Powered Software Testing & Test Design',
    items: [
      {
        type: 'video',
        title: 'Accelerating Requirements Review & Test Analysis',
        description:
          'Use plain-language analysis to inspect user journeys, UI screens, and product specs—turning raw requirements into structured coverage ideas faster.',
      },
      {
        type: 'video',
        title: 'Generating Structured Test Plans from User Stories',
        description:
          'Convert user stories and requirements documents into clear test plans complete with scope, deliverables, risk areas, and requirement traceability.',
      },
      {
        type: 'video',
        title: 'Deriving Comprehensive Test Scenarios from a Test Plan',
        description:
          'Expand a test plan into broad scenario coverage spanning functional flows, negative paths, input validation, security checks, and integration points.',
      },
      {
        type: 'video',
        title: 'Building Detailed Test Case Suites for Execution',
        description:
          'Transform high-level scenarios into spreadsheet-ready test cases with clear titles, preconditions, steps, test data, expected outcomes, and boundary checks.',
      },
      {
        type: 'resource',
        title: 'E-Commerce User Story & Test Design Prompt Pack',
      },
    ],
  },
  {
    id: 'first-qa-agents',
    title: 'Building Your First QA AI Agents',
    items: [
      {
        type: 'video',
        title: 'Web-Crawling Test Case Generator Agent',
        description:
          'Build an agent that inspects a live webpage, interprets interactive elements, and drafts structured manual test cases covering both happy and negative paths.',
      },
      {
        type: 'video',
        title: 'Automated Profile & Document Generation Agent',
        description:
          'Create an end-to-end document agent that takes structured profile details, generates clean styled HTML, and exports a shareable PDF.',
      },
      {
        type: 'resource',
        title: 'Agent Architecture & Prompt Reference',
      },
    ],
  },
  {
    id: 'ai-in-automation',
    title: 'Applying AI to Test Automation Engineering',
    items: [
      {
        type: 'video',
        title: 'Intent-Driven Development ("Vibe Coding") for QA',
        description:
          'Learn how describing test intent clearly lets AI assistants draft and iterate on automation code while engineers focus on architecture and verification.',
      },
      {
        type: 'video',
        title: 'Setting Up Your AI Automation Environment',
        description:
          'Configure a clean local setup with VS Code, Node.js, and GitHub Copilot across macOS, Windows, and Linux.',
      },
      {
        type: 'video',
        title: 'Working with GitHub Copilot in VS Code',
        description:
          'Use inline completions, chat, agent mode, debugging assistance, and MCP integrations inside VS Code to speed up daily automation work.',
      },
      {
        type: 'video',
        title: 'AI-Assisted Locator Discovery & Test Generation',
        description:
          'Generate resilient page locators and draft positive, negative, and edge-case automated tests in Playwright TypeScript or Selenium Java.',
      },
      {
        type: 'video',
        title: 'Bootstrapping a Playwright TypeScript Project Quickly',
        description:
          'Use an AI coding agent to initialize a fresh Playwright TypeScript workspace, install dependencies, write a form test, execute it, and review the report.',
      },
      {
        type: 'video',
        title: 'Architecting an Enterprise Page Object Model Framework',
        description:
          'Design a maintainable, production-ready framework structure with clean separation of page objects, fixtures, configuration, and reporting.',
      },
      {
        type: 'resource',
        title: 'Page Object Model Blueprint & Prompt Templates',
      },
      {
        type: 'video',
        title: 'Executing & Fixing Existing Page Object Suites with AI Agents',
        description:
          'Partner with coding agents to diagnose failures, repair broken selectors, and maintain data-driven cross-browser Playwright suites.',
      },
    ],
  },
  {
    id: 'mcp-multi-agent',
    title: 'Model Context Protocol (MCP) & Multi-Agent Systems',
    items: [
      {
        type: 'video',
        title: 'Introduction to Model Context Protocol (MCP)',
        description:
          'Understand how MCP gives AI models controlled, standardized access to external tools such as browsers, databases, APIs, and spreadsheets.',
      },
      {
        type: 'video',
        title: 'Browser Automation with Playwright MCP',
        description:
          'Connect a coding agent to a Playwright MCP server to navigate live pages, interact with controls, fill forms, and verify UI state dynamically.',
      },
      {
        type: 'video',
        title: 'Configuring Cursor IDE with Playwright & Selenium MCP',
        description:
          'Set up both Playwright and Selenium MCP servers inside Cursor IDE to compare tool capabilities, execution speed, and locator reliability.',
      },
      {
        type: 'video',
        title: 'Running Local Coding Agents with Ollama',
        description:
          'Configure local open-source LLMs with Ollama and CLI coding agents so teams can experiment privately without external API costs.',
      },
      {
        type: 'video',
        title: 'Scaffolding Python Automation Suites with CLI Agents',
        description:
          'Use a terminal-based AI coding agent to generate Selenium and Playwright Python Page Object projects, install packages, and verify test runs.',
      },
      {
        type: 'video',
        title: 'Database Verification via MongoDB MCP',
        description:
          'Set up MongoDB collections, seed test records, and connect an MCP server to inspect and validate backend state using plain-English queries.',
      },
      {
        type: 'video',
        title: 'API Testing Through OpenAPI MCP Servers',
        description:
          'Connect Swagger/OpenAPI specifications to an MCP server with base URLs and auth headers to explore endpoints and validate live API responses.',
      },
      {
        type: 'video',
        title: 'Test Data Operations with Excel MCP',
        description:
          'Automate workbook creation, sheet updates, synthetic data generation, row lookups, and duplicate checks through an Excel MCP server.',
      },
      {
        type: 'video',
        title: 'Multi-MCP Orchestration for Data-Driven End-to-End Flows',
        description:
          'Combine multiple MCP servers so an agent reads parameterized datasets from Excel and drives repeated end-to-end test iterations automatically.',
      },
      {
        type: 'video',
        title: 'End-to-End Conversational Commerce Agent Case Study',
        description:
          'Walk through a real-world multi-step MCP agent that searches catalogs, inspects options, manages a cart, and completes an order flow via prompts.',
      },
    ],
  },
  {
    id: 'e2e-manual-to-automation',
    title: 'End-to-End Manual-to-Automation Test Workflow',
    items: [
      {
        type: 'video',
        title: 'Designing a Connected Manual-to-Automation Pipeline',
        description:
          'Bridge manual test design and automated execution into one repeatable workflow that takes requirements all the way to runnable test scripts.',
      },
      {
        type: 'resource',
        title: 'End-to-End Workflow Prompt Templates',
      },
    ],
  },
  {
    id: 'custom-agents-skills',
    title: 'Custom Agent & Skill Configuration',
    items: [
      {
        type: 'video',
        title: 'Authoring Custom Agent.md and Skill.md Instructions',
        description:
          'Encode your team’s coding standards, naming rules, and testing conventions into reusable agent and skill files for consistent AI output.',
      },
      {
        type: 'resource',
        title: 'Sample Agent & Skill Configuration Templates',
      },
    ],
  },
  {
    id: 'java-copilot-eclipse',
    title: 'AI-Assisted Java Automation in Eclipse',
    items: [
      {
        type: 'video',
        title: 'Java Automation Prerequisites & Environment Setup',
        description:
          'Install and verify Eclipse IDE, Java JDK 17, and Maven, including configuring JAVA_HOME and MVN_HOME for enterprise Java test projects.',
      },
      {
        type: 'video',
        title: 'Installing & Using GitHub Copilot in Eclipse',
        description:
          'Add Copilot from the Eclipse Marketplace and use inline suggestions, code explanations, test generation, and agent mode inside Java projects.',
      },
      {
        type: 'video',
        title: 'Git & GitHub Workflows Driven by Natural-Language Prompts',
        description:
          'Initialize repositories, stage and push commits, and draft clear project README documentation with guided AI prompts.',
      },
    ],
  },
  {
    id: 'jira-playwright-agentic',
    title: 'Jira & Playwright Agentic Integration',
    items: [
      {
        type: 'video',
        title: 'Connecting Jira Issues to Automated Playwright Workflows',
        description:
          'Build an agentic workflow that reads Jira stories or defect tickets, drafts matching Playwright checks, and reports verification results back.',
      },
      {
        type: 'resource',
        title: 'Markdown Specification & Integration Templates',
      },
    ],
  },
  {
    id: 'n8n-qa-workflows',
    title: 'Visual QA Automation with n8n Workflows',
    items: [
      {
        type: 'video',
        title: 'Introduction to n8n for Quality Operations',
        description:
          'Explore how n8n connects Jira, Gmail, Slack, Google Sheets, and AI models in visual node-based workflows to eliminate repetitive QA reporting.',
      },
      {
        type: 'video',
        title: 'Building a Conversational Jira Bug-Reporting Agent',
        description:
          'Connect a chat trigger to an LLM-backed agent in n8n that structures bug details and logs complete Jira issues automatically.',
      },
      {
        type: 'video',
        title: 'Scheduled AI Defect Analysis & Daily Email Reports',
        description:
          'Build a scheduled workflow that fetches open defects each morning, summarizes trends with an AI model, and emails a formatted HTML digest.',
      },
      {
        type: 'video',
        title: 'Agentic Defect Triage & Priority Classification for QA Managers',
        description:
          'Design an autonomous triage workflow that categorizes incoming Jira defects by severity and routes tailored alerts and executive summaries.',
      },
      {
        type: 'resource',
        title: 'Reference n8n Workflow Blueprints',
      },
    ],
  },
];

function VideoIcon() {
  return (
    <svg className="syllabus-item-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.25" y="3.5" width="15.5" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 6.8L12.7 9L8.5 11.2V6.8Z" fill="currentColor" />
      <path d="M6.5 16.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ResourceIcon() {
  return (
    <svg className="syllabus-item-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.5 2.75H11.5L15 6.25V16.25C15 16.8 14.55 17.25 14 17.25H5.5C4.95 17.25 4.5 16.8 4.5 16.25V3.75C4.5 3.2 4.95 2.75 5.5 2.75Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 10.25H12.5M7.5 13.25H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Chevron({ open }) {
  return (
    <svg className={`syllabus-chevron ${open ? 'open' : ''}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Syllabus() {
  useSearchTarget();
  const [openSections, setOpenSections] = useState(() =>
    SYLLABUS_SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: true }), {}),
  );
  const [openLessons, setOpenLessons] = useState(() => {
    const initial = {};
    SYLLABUS_SECTIONS.forEach((section) => {
      section.items.forEach((item, index) => {
        if (item.description) initial[`${section.id}-${index}`] = true;
      });
    });
    return initial;
  });

  const totalLessons = SYLLABUS_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
  const allOpen = SYLLABUS_SECTIONS.every((section) => openSections[section.id]);

  function toggleAllSections() {
    const nextState = !allOpen;
    setOpenSections(
      SYLLABUS_SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: nextState }), {}),
    );
  }

  function toggleSection(id) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleLesson(key) {
    setOpenLessons((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="syllabus-page">
      <SiteNav active="courses" coursesHref="/membership#curriculum" mockHref="/mock-interview" ctaHref="/checkout" />

      <main className="syllabus-content">
        <span className="syllabus-label">AI FOR QA MANAGERS // SYLLABUS</span>
        <h1>AI for QA Managers: GenAI, AI Agents, MCP &amp; Workflow Automation</h1>
        <p className="syllabus-source">
          A practical curriculum covering generative AI, AI-assisted test design, Playwright and Java automation, Model Context Protocol (MCP) agents, and n8n quality workflows.
        </p>

        <section className="syllabus-curriculum" id="syllabus-course" tabIndex={-1}>
          <div className="syllabus-toolbar">
            <div>
              <h2>Program curriculum</h2>
              <p className="syllabus-meta">
                {SYLLABUS_SECTIONS.length} modules · {totalLessons} sessions &amp; templates
              </p>
            </div>
            <button type="button" className="syllabus-toggle-all" onClick={toggleAllSections}>
              {allOpen ? 'Collapse all modules' : 'Expand all modules'}
            </button>
          </div>

          <div className="syllabus-accordion">
            {SYLLABUS_SECTIONS.map((section) => {
              const isOpen = Boolean(openSections[section.id]);
              return (
                <article className="syllabus-section-card" key={section.id}>
                  <button
                    type="button"
                    className="syllabus-section-header"
                    aria-expanded={isOpen}
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className="syllabus-section-left">
                      <Chevron open={isOpen} />
                      <strong>{section.title}</strong>
                    </span>
                    <span className="syllabus-section-count">
                      {section.items.length} {section.items.length === 1 ? 'topic' : 'topics'}
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="syllabus-lesson-list">
                      {section.items.map((item, index) => {
                        const lessonKey = `${section.id}-${index}`;
                        const hasDescription = Boolean(item.description);
                        const isLessonOpen = Boolean(openLessons[lessonKey]);
                        return (
                          <li className="syllabus-lesson-item" key={lessonKey}>
                            <div className="syllabus-lesson-row">
                              {item.type === 'video' ? <VideoIcon /> : <ResourceIcon />}
                              <div className="syllabus-lesson-body">
                                {hasDescription ? (
                                  <button
                                    type="button"
                                    className="syllabus-lesson-trigger"
                                    aria-expanded={isLessonOpen}
                                    onClick={() => toggleLesson(lessonKey)}
                                  >
                                    <span>{item.title}</span>
                                    <Chevron open={isLessonOpen} />
                                  </button>
                                ) : (
                                  <span className="syllabus-lesson-title">{item.title}</span>
                                )}
                                {hasDescription && isLessonOpen && (
                                  <p className="syllabus-lesson-desc">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>

          <div className="syllabus-footer-actions">
            <a className="syllabus-button" href="/home#courses">← Back to course programs</a>
            <a className="syllabus-cta" href="/checkout">Enroll in this program →</a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Syllabus;
