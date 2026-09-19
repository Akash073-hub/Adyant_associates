# Adyant Associates SDET Academy

Adyant Associates is a React-based frontend prototype for an enterprise Software Development Engineer in Test (SDET) training platform. The application presents professional automation engineering courses, live cohorts, practice sandboxes, mentorship, code reviews, and an enrollment checkout flow.

The project is intended to demonstrate the complete learner journey and the visual direction of the product. It is currently a frontend-only application. Authentication, course data, payment processing, email, and backend persistence are not connected yet.

## What This Project Means

The product is designed for engineers who want to move from manual or basic QA work into production-level test automation and SDET architecture. The content focuses on:

- Playwright and TypeScript
- Selenium 4 and Java 21
- Appium 2.0 for mobile automation
- REST, GraphQL, and API automation
- Docker-based distributed test grids
- CI/CD, GitHub workflows, and parallel test execution
- GenAI-assisted test generation and resilient locators
- Code reviews, system design, and enterprise engineering practices

The interface models an academy where a learner can discover a track, review the curriculum, reserve a cohort seat, authenticate into a member portal, and complete enrollment.

## Why We Use It

This project gives the team a working product surface before backend development begins. It helps us:

1. Validate the intended learner experience and navigation.
2. Demonstrate course offerings and the training process to stakeholders.
3. Establish reusable page layouts, typography, colors, forms, cards, tables, and responsive styles.
4. Identify the data and API contracts needed for authentication, enrollment, payments, and learner progress.
5. Provide a base that can later be connected to a real backend and deployment pipeline.

## Current User Process

The intended process currently looks like this:

1. A visitor opens the home page and reviews the academy value proposition.
2. The visitor filters the available courses by technology or track.
3. The visitor reviews live cohorts, dates, mentors, session times, and availability.
4. The visitor opens the membership page to inspect pedagogy, curriculum tracks, upcoming programs, classroom preview, and FAQs.
5. The visitor can open the sign-in page to access the engineering portal.
6. A learner selects a track and opens checkout.
7. The checkout page displays payment methods, a UPI address, a seat reservation countdown, curriculum details, pricing, and enrollment confirmation.

## What We Have Till Now

### Home page

- Branded Adyant Associates / adyant.pro header and footer.
- Hero section describing the SDET career platform.
- Architecture and learning value pillars.
- Course cards for Playwright, Selenium, Appium, and API automation.
- Course filtering using React state.
- Live cohort schedule table with mentors, time zones, and capacity.
- Social proof, testimonials, and partner-style logos.
- Automation readiness assessment form with a submitted state.
- Newsletter-style email input area.

### Membership page

- Architecture-first teaching principles.
- Active course tracks and upcoming 2027 programs.
- Enrollment links to checkout.
- Classroom preview with a play/pause interaction.
- Chapter list for the sample lesson.
- Admissions FAQ using expandable details elements.

### Sign-in page

- Candidate username and email fields.
- Session persistence checkbox.
- Enterprise security messaging.
- Authentication button with a local success state.
- Navigation back to the home page.

### Checkout page

- Payment method selector for UPI, card, net banking, and corporate purchase order.
- UPI QR-style display and copy-to-clipboard action.
- Seat reservation countdown.
- Order summary with cohort details, deliverables, discount, and total tuition.
- Enrollment confirmation button with a local confirmation state.

## Current Stopping Point

The project is stopped at the frontend prototype stage. The screens and primary interactions are present, but they are not yet backed by real services.

The following parts are still pending:

- Real user registration, login, sessions, and password reset.
- A backend database for users, courses, cohorts, enrollments, and progress.
- Admin tools for managing course content, mentors, seats, and schedules.
- A real payment provider and server-side payment verification.
- Persistent enrollment confirmation and email receipts.
- Private GitHub repository and pull request integration for code reviews.
- Real practice sandboxes and test execution infrastructure.
- Learner dashboard, certificates, progress tracking, and credential verification.
- Production error handling, analytics, accessibility audit, and security review.
- Complete automated tests for the current screens and interactions.

## Routes

The application uses simple path-based rendering in `src/App.jsx`:

| Route | Screen |
| --- | --- |
| `/` | Home page |
| `/login` | Member sign-in page |
| `/membership` | Curriculum and membership page |
| `/checkout` | Enrollment checkout page |

This is not a full routing library yet. Navigation is handled with normal links and a small `history.pushState` helper used by the sign-in screen.

## Project Structure

```text
work/
|-- public/                 Static public files
|-- src/
|   |-- App.jsx             Path-based application entry
|   |-- home.jsx            Home page and course discovery
|   |-- membership.jsx      Curriculum and membership page
|   |-- signin.jsx          Member sign-in screen
|   |-- checkout.jsx        Enrollment checkout screen
|   |-- *.css               Page and global styles
|   |-- index.js            React application bootstrap
|   |-- App.test.js         React test entry point
|-- build/                  Existing production build output
|-- package.json            Dependencies and npm scripts
```

## Technology

- React 19
- React DOM
- Create React App / `react-scripts`
- JavaScript and JSX
- CSS
- React Testing Library and Jest

## Getting Started

From the `work` directory, install dependencies and start the development server:

```bash
npm install
npm start
```

Open `http://localhost:3000` in a browser. The development server reloads when source files change.

## Available Commands

```bash
npm start       # Start the development server
npm test        # Run the test runner
npm run build   # Create an optimized production build in build/
```

## Recommended Next Development Order

1. Replace the placeholder test with route and interaction tests.
2. Add a real router and shared navigation behavior.
3. Define the backend models and API contract for courses, cohorts, users, and enrollments.
4. Implement authentication and protect member-only pages.
5. Integrate payment processing with server-side verification.
6. Persist checkout and enrollment data.
7. Connect the learner dashboard, GitHub review workflow, sandbox environments, and certificates.
8. Run an accessibility, security, responsive, and production deployment review.
