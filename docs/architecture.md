# Architecture Overview

## System Design

AI FocusFlow is a serverless productivity platform on AWS that combines task management, AI-powered planning, real-time AWS content feeds, and gamification — all deployed as a production SaaS.

## Architecture Diagram

> Open `docs/architecture-diagram.drawio` in [draw.io](https://app.diagrams.net) for the full visual diagram with AWS service icons.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                            │
│                                                                          │
│  ┌────────────────────────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  React SPA                     │  │ AWS Amplify  │  │ AWS RSS Feeds│ │
│  │  Vite + TypeScript + Tailwind  │──│ Hosting      │  │ (Real-time)  │ │
│  │  Framer Motion + Recharts      │  │ CI/CD GitHub │  │ 8 Blog feeds │ │
│  │  Gamification (XP/Streaks)     │  └─────────────┘  └──────────────┘ │
│  │  Onboarding Flow               │                                     │
│  └────────────────┬───────────────┘                                     │
└───────────────────┼─────────────────────────────────────────────────────┘
                    │ HTTPS
┌───────────────────┼─────────────────────────────────────────────────────┐
│  API & AUTH LAYER │                                                      │
│                   ▼                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────┐  ┌───────────┐ │
│  │ API Gateway      │  │ Amazon Cognito   │  │  SES  │  │CloudWatch │ │
│  │ REST + CORS      │  │ Custom Auth OTP  │──│ Email │  │ Logs      │ │
│  │ /api/*           │  │ Email Passwordless│  │       │  │           │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┘  └───────────┘ │
└───────────┼──────────────────────┼──────────────────────────────────────┘
            │                      │
┌───────────┼──────────────────────┼──────────────────────────────────────┐
│  COMPUTE  │                      │                                       │
│           ▼                      ▼                                       │
│  ┌──────┐ ┌──────┐ ┌────┐ ┌────────┐ ┌─────────┐ ┌──────┐ ┌────────┐ │
│  │ Auth │ │Tasks │ │ AI │ │Planner │ │Analytics│ │Notif │ │Cognito │ │
│  │  λ   │ │  λ   │ │ λ  │ │   λ    │ │    λ    │ │  λ   │ │Triggers│ │
│  └──┬───┘ └──┬───┘ └─┬──┘ └───┬────┘ └────┬────┘ └──┬───┘ │  (x4)  │ │
│     │        │        │        │            │         │      └────────┘ │
│  AWS Lambda — Node.js 20, ARM64, 256-512MB                              │
└─────┼────────┼────────┼────────┼────────────┼─────────┼────────────────┘
      │        │        │        │            │         │
┌─────┼────────┼────────┼────────┼────────────┼─────────┼────────────────┐
│  DATA + AI   │        │        │            │         │                 │
│     │        ▼        ▼        ▼            ▼         ▼                 │
│     │  ┌──────────────────┐  ┌────────────────────────────┐            │
│     └─▶│  DynamoDB        │  │  Amazon Bedrock             │            │
│        │  4 Tables:       │  │  Nova Lite (AI Engine)      │            │
│        │  • Tasks (+ GSI) │  │  • Task Prioritization      │            │
│        │  • Plans         │  │  • Daily Plan Generation    │            │
│        │  • Insights (TTL)│  │  • Productivity Coaching    │            │
│        │  • Notifications │  │  • Task Breakdown           │            │
│        │  PAY_PER_REQUEST │  │  • Insights & Review        │            │
│        └──────────────────┘  └────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  AGENTIC LAYER (Optional — Local/Advanced)                              │
│                                                                          │
│  ┌─────────────────────┐       ┌─────────────────────────────────────┐ │
│  │ MCP Server (TS)     │◄─────▶│ Strands Agents SDK (Python)         │ │
│  │ 21 Tools via stdio  │  MCP  │ 6 Agents: Coach, Planner, Breakdown │ │
│  │ Tasks · Planner     │ proto │ Review, AWS Learning, Orchestrator  │ │
│  │ Analytics · AWS News│       │ BedrockModel + Agentic Loop         │ │
│  └─────────────────────┘       └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## AWS Services Used

| Service | Purpose | Color (in diagram) |
|---------|---------|-------------------|
| **AWS Amplify** | Frontend hosting + CI/CD from GitHub | Orange |
| **Amazon API Gateway** | REST API with CORS and JWT auth | Pink/Magenta |
| **Amazon Cognito** | Passwordless email OTP authentication | Red |
| **Amazon SES** | Sends OTP verification emails | Red |
| **AWS Lambda** | 6 API handlers + 4 Cognito triggers (Node.js 20, ARM64) | Orange |
| **Amazon DynamoDB** | 4 tables with GSIs and TTL (pay-per-request) | Blue |
| **Amazon Bedrock** | Nova Lite AI for planning, coaching, insights | Teal |
| **Amazon CloudWatch** | Structured JSON logging | Pink |
| **AWS IAM** | Least-privilege Lambda execution roles | Red |
| **AWS CDK** | Infrastructure as code (TypeScript) | Pink |

## DynamoDB Schema

### Tasks Table
| Key | Type | Description |
|-----|------|-------------|
| `userId` (PK) | String | Partition key — user isolation |
| `id` (SK) | String | Unique task ID |
| **GSI: StatusIndex** | userId + status | Query tasks by status |
| **GSI: DueDateIndex** | userId + dueDate | Query by deadline |

**Attributes:** title, description, priority, status, category, tags[], dueDate, estimatedMinutes, progress, subtasks[], order, createdAt, updatedAt, completedAt

### Plans Table
| Key | Type |
|-----|------|
| `userId` (PK) | String |
| `date` (SK) | String (YYYY-MM-DD) |

**Attributes:** timeBlocks[], availableHours, energyPattern, createdAt

### Insights Table
| Key | Type |
|-----|------|
| `userId` (PK) | String |
| `createdAt` (SK) | String (ISO timestamp) |

**TTL:** `ttl` — auto-expires after 30 days

### Notifications Table
| Key | Type |
|-----|------|
| `userId` (PK) | String |
| `id` (SK) | String |

**TTL:** `ttl` — auto-expires after 7 days

## Authentication Flow (Email OTP)

```
User enters email
    │
    ▼
Cognito initiateAuth (CUSTOM_AUTH)
    │
    ├──▶ DefineAuthChallenge Lambda (issue CUSTOM_CHALLENGE)
    │
    ├──▶ CreateAuthChallenge Lambda (generate 6-digit OTP, send via SES)
    │
    ▼
User enters OTP code
    │
    ├──▶ VerifyAuthChallenge Lambda (compare codes)
    │
    ▼
JWT tokens issued (id_token + access_token)
```

**PreSignUp Lambda** auto-confirms users so they can sign in immediately.

## AI Agent Architecture

```
User Request → API Gateway → AI Lambda → Bedrock Nova Lite
                                            │
                                   Structured Prompt:
                                   • System: Agent role + JSON schema
                                   • Context: Tasks, preferences, time
                                   • User: The specific question
                                            │
                                            ▼
                                   JSON Response:
                                   • Recommendations
                                   • Confidence score
                                   • Reasoning (brief)
```

All agents use:
- **System prompt** defining role, capabilities, and response JSON schema
- **Context block** with real user data (tasks, deadlines, progress)
- **JSON-only output** — no free-text, always parseable
- **Confidence scores** (0-1) on every recommendation

## Security Model

1. **Auth:** Cognito issues JWTs after email OTP verification
2. **API:** API Gateway validates JWT before Lambda execution
3. **Data isolation:** DynamoDB uses userId as partition key
4. **Input validation:** Zod schemas on all request bodies
5. **Least privilege:** Each Lambda has only the IAM permissions it needs
6. **Transport:** HTTPS enforced, HSTS headers via Amplify
7. **Secrets:** No secrets in code — environment variables set by CDK

## Performance

- **Cold starts:** ARM64 + small bundle (~200ms)
- **DynamoDB:** Single-digit millisecond latency at any scale
- **Bedrock:** Nova Lite inference ~1-3s per request
- **Frontend:** Vite code splitting, React Query caching, optimistic updates
- **RSS feeds:** 5-minute client-side cache, no backend dependency

## Cost (Free Tier Friendly)

| Service | Free Tier | Estimated Monthly (1 user) |
|---------|-----------|---------------------------|
| Lambda | 1M requests free | $0 |
| DynamoDB | 25 WCU/RCU free | $0 |
| Bedrock | Pay-per-token | ~$0.50-1.00 |
| Cognito | 50K MAU free | $0 |
| Amplify | 1000 build min free | $0 |
| SES | 62K emails free (from Lambda) | $0 |
| **Total** | | **~$0.50-1.00/month** |

---

## Related Documentation

- [Amazon Bedrock Setup](./bedrock-setup.md)
- [MCP + Strands Agents Guide](./mcp-strands-guide.md)
- [Deployment Guide](./deployment-guide.md)
- [Project Article](./article.md)
- [Architecture Diagram](./architecture-diagram.drawio)
