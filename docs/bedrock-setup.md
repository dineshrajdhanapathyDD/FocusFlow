# Amazon Bedrock Configuration

## Enable Model Access

1. Sign in to the [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **Amazon Bedrock** → Region: **us-east-1**
3. In the left sidebar, click **Model access**
4. Click **Manage model access**
5. Find **Amazon** section and check **Nova Lite**
6. Click **Request model access**
7. Access is typically granted immediately for Amazon models

## Model Details

| Property | Value |
|----------|-------|
| Model ID | `amazon.nova-lite-v1:0` |
| Max tokens | 5,120 output |
| Context window | 300K tokens |
| Pricing | ~$0.06 / 1M input tokens, ~$0.24 / 1M output tokens |
| Regions | us-east-1, us-west-2, eu-west-1 |

## How FocusFlow Uses Bedrock

The AI Lambda function (`focusflow-ai-dev`) calls Bedrock for:

| Feature | What it does |
|---------|-------------|
| **Task Prioritization** | Scores tasks by urgency, importance, and effort |
| **Daily Planning** | Generates time-blocked schedules |
| **Productivity Coaching** | Analyzes workload and recommends actions |
| **Task Breakdown** | Decomposes large tasks into subtasks |
| **Insights & Review** | Daily summaries with patterns |
| **AWS Hub AI Guide** | Answers AWS learning questions |

## IAM Permissions

The AI Lambda function needs (automatically configured by CDK):

```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": "*"
}
```

## Cost Estimation

For a single user with moderate usage:
- ~50 AI requests/day
- ~500 input tokens + ~800 output tokens per request
- **Monthly cost: ~$0.50-$1.00**

## Prompt Engineering

All AI agents follow these conventions:
- System prompt defines the agent's role and JSON response schema
- Responses are always valid JSON (never free-text)
- Chain-of-thought is internal only (never exposed to user)
- Confidence scores (0-1) included in all responses
- Context includes current tasks, user preferences, and time

Example system prompt structure:
```
SYSTEM: You are the Productivity Coach. Your role is to...
RULES: Always respond in JSON format...
RESPONSE SCHEMA: { "message": "...", "recommendations": [...], "confidence": 0.85 }
```

## Switching Models

Update the `BEDROCK_MODEL_ID` environment variable in the Lambda:

```bash
# More capable, higher cost
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# Faster, lower cost (for simple queries)
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0
```

Or update in CDK stack (`infrastructure/cdk/src/stack.ts`):
```typescript
environment: {
  BEDROCK_MODEL_ID: 'amazon.nova-pro-v1:0',
}
```

## Testing Bedrock Access

```bash
aws bedrock-runtime invoke-model \
  --model-id amazon.nova-lite-v1:0 \
  --region us-east-1 \
  --content-type application/json \
  --accept application/json \
  --body '{"schemaVersion":"messages-v1","messages":[{"role":"user","content":[{"text":"Hello"}]}],"inferenceConfig":{"max_new_tokens":100}}' \
  output.json

cat output.json
```

If this returns successfully, Bedrock is properly configured.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `AccessDeniedException` | Enable model access in Bedrock console |
| `ResourceNotFoundException` | Check region — Nova Lite is in us-east-1 |
| Timeout errors | Lambda timeout is 60s; Nova Lite usually responds in 1-3s |
| Empty responses | Check system prompt format matches Nova's `messages-v1` schema |

---

## Related Documentation

- [Architecture Overview](./architecture.md)
- [MCP + Strands Agents Guide](./mcp-strands-guide.md)
- [Deployment Guide](./deployment-guide.md)
- [Project Article](./article.md)
