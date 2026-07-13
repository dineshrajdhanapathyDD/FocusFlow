# Weekend Productivity Challenge: AI FocusFlow

**#productivity**

---

## Vision & What the App Does

AI FocusFlow is a personal AI-powered productivity planner that helps you organize work, stay focused, and never miss what matters in the AWS ecosystem.

**The Problem:** We all struggle with the same productivity challenges — too many tasks, no clear priorities, scattered schedules, and constantly falling behind on learning new AWS services. Existing to-do apps tell you *what* to do but never *when* or *why*.

**The Solution:** FocusFlow uses Amazon Bedrock AI to intelligently prioritize your tasks, generate optimized daily schedules based on your energy patterns, break complex work into manageable pieces, and keep you current with real-time AWS news and events.

**From the user's perspective:**

1. **Sign in with just your email** — enter your address, get a one-time code, you're in. No passwords.
2. **Create tasks** with priorities, categories, tags, and time estimates.
3. **Ask the AI** — "What should I focus on today?" and it analyzes your deadlines, workload, and energy pattern to recommend the optimal order.
4. **Generate a daily plan** — AI creates a time-blocked schedule with focus blocks, breaks, and buffer time.
5. **Track progress** — Dashboard shows completion rates, streaks, and an AI productivity score.
6. **Stay current with AWS** — Live feed pulls real-time articles from 8 AWS blog RSS feeds, What's New announcements, and upcoming events.
7. **Level up** — Earn XP, maintain streaks, unlock achievements, and complete daily challenges.

---

## How I Built It

### Development Process

I built FocusFlow over an intensive weekend sprint, treating it as a real production SaaS from day one. The approach:

**Day 1: Foundation**
- Scaffolded the full monorepo: React frontend (Vite + TypeScript + Tailwind), Node.js Lambda backend, and infrastructure as code
- Built the complete type system first (TypeScript interfaces for tasks, plans, agents, analytics)
- Created reusable UI component library (Button, Card, Dialog, Badge, etc.) before any pages

**Day 2: Core Features + AI**
- Implemented all page layouts with responsive sidebar, dark mode, route transitions
- Built the AI agent system with structured prompts for each agent role
- Created the Lambda handlers with DynamoDB integration
- Deployed to AWS using CDK

**Day 3: Polish + Innovation**
- Added the MCP server (Model Context Protocol) with 21 tools for agentic workflows
- Built Strands Agents (Python) for autonomous task management
- Integrated real-time AWS RSS feeds for the AWS Hub
- Added gamification (XP, streaks, achievements) and interactive onboarding
- Implemented premium animations with Framer Motion

### Key Decisions

- **Email OTP over passwords** — Better UX, more secure, less friction. Used Cognito custom auth challenges with Lambda triggers.
- **MCP for tool access** — Instead of hardcoding AI capabilities, I exposed everything as MCP tools. Any MCP client (Claude, Kiro, Cursor) can now manage tasks through the same protocol.
- **RSS for real-time AWS content** — Rather than scraping or using a database, the app fetches live RSS feeds from aws.amazon.com directly. Always fresh, zero maintenance.
- **CDK over SAM** — Easier to express complex relationships (Cognito triggers, IAM policies) in TypeScript.

### Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Lambda ESM module resolution failing | Switched to CommonJS output for Lambda compatibility |
| CDK not updating Lambda code (asset hash caching) | Direct `update-function-code` via CLI as workaround |
| SES sandbox blocking OTP emails | Built dev mode that returns OTP in challenge params |
| Amplify build failing on monorepo | Added `appRoot: frontend` in amplify.yml |
| Agent service not deployed (Python) | Routed AI Guide through the deployed Bedrock Lambda directly |

---

## AWS Services Used / Architecture Overview

### Services

| Service | Purpose |
|---------|---------|
| **Amazon Bedrock** (Nova Lite) | AI engine — task prioritization, daily planning, coaching, insights |
| **AWS Lambda** (Node.js 20, ARM64) | 6 API handlers + 4 Cognito triggers |
| **Amazon API Gateway** | REST API with CORS |
| **Amazon DynamoDB** | 4 tables (Tasks, Plans, Insights, Notifications) — pay-per-request |
| **Amazon Cognito** | Passwordless email OTP authentication with custom auth flow |
| **Amazon SES** | Sends OTP verification codes |
| **AWS Amplify Hosting** | Frontend deployment with CI/CD from GitHub |
| **Amazon CloudWatch** | Structured logging, metrics |
| **AWS CDK** | Infrastructure as code (entire stack in TypeScript) |

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  React Frontend (Vite + Tailwind + Framer Motion)            │
│  Hosted on AWS Amplify — Auto-deploys from GitHub            │
│  Fetches real-time AWS RSS feeds directly                    │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼───────────────────────────────────────┐
│  Amazon API Gateway (REST)                                   │
│  + Amazon Cognito JWT Authorizer (Email OTP)                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│  AWS Lambda Functions (Node.js 20, ARM64)                    │
│                                                              │
│  ┌──────┐ ┌──────┐ ┌────┐ ┌────────┐ ┌─────────┐ ┌──────┐ │
│  │ Auth │ │Tasks │ │ AI │ │Planner │ │Analytics│ │Notif │ │
│  └──┬───┘ └──┬───┘ └─┬──┘ └───┬────┘ └────┬────┘ └──┬───┘ │
└─────┼────────┼────────┼────────┼───────────┼─────────┼──────┘
      │        │        │        │           │         │
      ▼        ▼        ▼        ▼           ▼         ▼
┌──────────┐ ┌────────────────┐ ┌──────────────────────────┐
│ Cognito  │ │   DynamoDB     │ │    Amazon Bedrock        │
│ + SES    │ │   (4 tables)   │ │    (Nova Lite AI)        │
│ (OTP)    │ │   PAY_PER_REQ  │ │    Structured Prompts    │
└──────────┘ └────────────────┘ └──────────────────────────┘

Optional Agentic Layer:
┌──────────────────────────────────────────────────────────────┐
│  MCP Server (21 tools) ←→ Strands Agents (6 agents)         │
│  Model Context Protocol for tool-use autonomy                │
└──────────────────────────────────────────────────────────────┘
```

> A full draw.io diagram is included in the repository at `docs/architecture-diagram.drawio`

---

## What I Learned

### New Skills Discovered

1. **Model Context Protocol (MCP)** — Building an MCP server that exposes app functionality as tools was eye-opening. Once you have tools defined, *any* AI client can use them. The protocol is the future of AI-tool integration.

2. **Strands Agents SDK** — AWS's open-source agentic SDK is remarkably simple. An agent is just: model + tools + prompt. The agentic loop (reason → act → observe → repeat) happens automatically.

3. **Cognito Custom Auth Challenges** — Implementing passwordless OTP required 4 Lambda triggers working in concert (Define → Create → Verify → PreSignUp). It's more complex than password auth but the UX is worth it.

4. **Amazon Bedrock Nova Lite** — Fast, cheap, and capable enough for structured JSON responses. The key insight: well-crafted system prompts with explicit JSON schemas produce reliable, parseable output every time.

5. **RSS as a real-time data source** — No database needed for the AWS news feature. RSS feeds from aws.amazon.com are updated multiple times daily and are freely accessible. A simple 5-minute cache keeps things fast.

### Architecture Insights

- **Serverless is the right default** for productivity apps — usage is bursty (heavy during work hours, zero at night). Pay-per-request DynamoDB + Lambda means near-zero cost at low scale.
- **CDK > SAM** for complex stacks — once you have Cognito triggers, IAM cross-references, and multiple tables, TypeScript CDK is much more maintainable.
- **Gamification drives habit formation** — XP, streaks, and achievements aren't just fun. They create feedback loops that make users come back daily.
- **Separation of AI from UI** — The AI endpoints work independently of the frontend. You can query them via curl, MCP, or the Strands agent. This decoupling makes the system extensible.

### What Surprised Me

The entire backend (6 Lambda functions, 4 Cognito triggers, 4 DynamoDB tables, API Gateway, Cognito pool) deploys in under 2 minutes with CDK. The AWS serverless stack is genuinely production-ready for solo developers.

---

## Link to App & Repo

- **Live App:** Deployed on AWS Amplify (linked to GitHub main branch)
- **GitHub Repo:** [github.com/dineshrajdhanapathyDD/FocusFlow](https://github.com/dineshrajdhanapathyDD/FocusFlow)
- **API Endpoint:** `https://utp50r9qdd.execute-api.us-east-1.amazonaws.com/dev/`
- **Region:** us-east-1

### Try It

1. Open the app
2. Enter any email address
3. Enter the OTP code shown (dev mode auto-fills it)
4. Explore the Dashboard, Tasks, AI Assistant, and AWS Hub

### Run Locally

```bash
git clone https://github.com/dineshrajdhanapathyDD/FocusFlow.git
cd FocusFlow/frontend
npm install && npm run dev
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, React Query |
| Backend | AWS Lambda (Node.js 20), TypeScript, Zod validation |
| Database | Amazon DynamoDB (4 tables, pay-per-request) |
| AI | Amazon Bedrock (Nova Lite), structured prompts, JSON-only responses |
| Auth | Amazon Cognito (custom auth OTP via SES) |
| Hosting | AWS Amplify (CI/CD from GitHub) |
| IaC | AWS CDK (TypeScript) |
| Agentic | MCP Server (21 tools) + Strands Agents SDK (6 agents) |
| Real-time | AWS RSS feeds (8 blogs + What's New) |

---

*Built with ☕ and AI during the AWS Productivity Challenge*
