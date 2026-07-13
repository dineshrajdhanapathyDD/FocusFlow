# AI FocusFlow - Personal AI Productivity Planner

A modern, production-ready AI-powered productivity web application that helps users organize work using Amazon Bedrock AI. Features intelligent task prioritization, AI-generated daily schedules, real-time AWS news feeds, gamification, and an agentic MCP + Strands integration.

![FocusFlow.drawio.png](https://images.tomarkdown.dev/uploaded/5tzcpq4433csulnh.png)


**Live on AWS** | [Architecture Diagram](docs/architecture-diagram.drawio) | [Full Article](docs/article.md)

## Features

### Core
- **Smart Task Manager** - Create, edit, delete tasks with priorities, categories, tags, due dates, search, and filters
- **AI Task Prioritizer** - Analyzes tasks using urgency, importance, effort, and dependencies to recommend execution order
- **AI Daily Planner** - Generates optimized schedules based on available hours, deadlines, energy levels
- **AI Task Breakdown** - Converts large tasks into actionable subtasks with milestones
- **AWS Hub** - Real-time news from 8 AWS blog RSS feeds, What's New announcements, learning paths
- **Gamification** - XP points, streaks, achievements, daily challenges, level progression
- **Email OTP Auth** - Passwordless login via Amazon Cognito custom auth + SES
- **Productivity Dashboard** - Visual metrics, weekly charts, AI productivity score, deadlines
- **AI Insights** - Daily summaries, burnout warnings, focus recommendations
- **Notifications** - Deadline reminders, overdue alerts, achievement badges

### AI Agents
| Agent | Purpose |
|-------|---------|
| Productivity Coach | Workload analysis and priority recommendations |
| Planning Agent | Optimized daily schedule generation |
| Breakdown Agent | Complex task decomposition |
| Motivation Agent | Personalized encouragement |
| Review Agent | End-of-day productivity summaries |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  React Frontend │────▶│  API Gateway     │────▶│  Lambda         │
│  (Amplify)      │     │  (REST + JWT)    │     │  Functions      │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                              ┌────────────────────────────┼──────────┐
                              │                            │          │
                              ▼                            ▼          ▼
                     ┌─────────────────┐      ┌──────────────┐  ┌─────────┐
                     │   DynamoDB      │      │  Bedrock     │  │ Cognito │
                     │   (4 tables)    │      │  Nova Lite   │  │  Auth   │
                     └─────────────────┘      └──────────────┘  └─────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts |
| State | React Query, React Hook Form, Zod |
| Backend | AWS Lambda, Node.js 20, TypeScript |
| Database | Amazon DynamoDB (4 tables, pay-per-request) |
| AI | Amazon Bedrock (Nova Lite) |
| Auth | Amazon Cognito |
| Hosting | AWS Amplify |
| IaC | AWS SAM (CloudFormation) |

## Project Structure

```
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # UI and feature components
│   │   │   ├── ui/         # Reusable primitives (Button, Card, etc.)
│   │   │   ├── tasks/      # Task-related components
│   │   │   ├── dashboard/  # Dashboard widgets
│   │   │   ├── planner/    # Daily planner
│   │   │   ├── ai/         # AI chat interface
│   │   │   ├── analytics/  # Charts and metrics
│   │   │   └── notifications/
│   │   ├── contexts/       # Auth and Theme providers
│   │   ├── hooks/          # React Query hooks
│   │   ├── services/       # API client layer
│   │   ├── pages/          # Route pages
│   │   ├── layouts/        # Page layouts
│   │   ├── lib/            # Utilities and constants
│   │   └── types/          # TypeScript interfaces
│   └── public/
├── backend/                # Lambda functions
│   └── src/
│       ├── handlers/       # API endpoint handlers
│       ├── agents/         # AI agent logic
│       │   └── prompts/    # Structured prompt templates
│       ├── services/       # Bedrock, DynamoDB clients
│       └── utils/          # Auth, validation, logging
├── infrastructure/         # AWS SAM template
│   ├── template.yaml       # CloudFormation resources
│   └── samconfig.toml      # Deployment configuration
└── docs/                   # Additional documentation
```

## Quick Start

### Prerequisites
- Node.js 20+
- AWS CLI configured with credentials
- AWS SAM CLI
- Amazon Bedrock access (Nova Lite model enabled)


Link to App & Repo

- **Live App:** FocusFlow (https://main.djlzywreto6am.amplifyapp.com/)
- **GitHub Repo:** [github.com/dineshrajdhanapathyDD/FocusFlow](https://github.com/dineshrajdhanapathyDD/FocusFlow)
- **Region:** us-east-1


### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000

# Backend (local server simulating Lambda)
cd backend
npm install
npm run dev          # http://localhost:4000
```

The frontend proxies `/api` requests to `localhost:4000`. Use the demo login:
- Email: `demo@focusflow.ai`
- Password: `demo123`

### Deploy to AWS

```bash
# 1. Build backend
cd backend
npm run build

# 2. Deploy infrastructure
cd infrastructure
sam build
sam deploy --guided    # First time
sam deploy             # Subsequent

# 3. Deploy frontend
cd frontend
# Set VITE_API_URL to the API Gateway URL from SAM outputs
npm run build
# Deploy dist/ to Amplify or S3+CloudFront
```

## Environment Variables

### Frontend (`frontend/.env`)
```
VITE_API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxx
```

### Backend (set by SAM template)
```
TASKS_TABLE=FocusFlow-Tasks-dev
PLANS_TABLE=FocusFlow-Plans-dev
INSIGHTS_TABLE=FocusFlow-Insights-dev
NOTIFICATIONS_TABLE=FocusFlow-Notifications-dev
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Authenticate user |
| POST | /api/auth/register | Create account |
| GET | /api/tasks | List all tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/ai/chat | Chat with AI agent |
| POST | /api/ai/prioritize | AI task prioritization |
| POST | /api/ai/breakdown | AI task breakdown |
| POST | /api/ai/plan | AI daily plan generation |
| GET | /api/ai/insights | Get AI insights |
| GET | /api/planner/:date | Get daily plan |
| POST | /api/planner | Save daily plan |
| GET | /api/analytics | Get productivity metrics |
| GET | /api/notifications | List notifications |
| PUT | /api/notifications/:id/read | Mark read |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| N | New Task |
| / | Focus Search |
| 1-6 | Navigate Pages |
| T | Toggle Theme |

## Security

- JWT authentication via Amazon Cognito
- API Gateway authorizer validates tokens
- IAM least-privilege for all Lambda roles
- Input validation with Zod schemas
- CORS configured for frontend origin
- Security headers via Amplify (HSTS, X-Frame-Options, etc.)
- DynamoDB user-scoped queries (userId partition key)

## Cost Optimization (Free Tier)

- DynamoDB: On-demand (pay-per-request) - 25 WCU/RCU free
- Lambda: ARM64 architecture - 1M free requests/month
- Bedrock: Pay-per-token (Nova Lite is cost-effective)
- Cognito: 50,000 MAU free tier
- Amplify Hosting: 1000 build minutes free
- CloudWatch: 5GB log ingestion free

## License

MIT
