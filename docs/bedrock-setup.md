# Amazon Bedrock Configuration

## Enable Model Access

1. Sign in to the [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **Amazon Bedrock** service
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

## IAM Permissions

The AI Lambda function needs:

```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": "*"
}
```

This is automatically configured in the SAM template.

## Cost Estimation

For a single user with moderate usage:
- ~50 AI requests/day
- ~500 input tokens + ~800 output tokens per request
- Monthly cost: ~$0.50-$1.00

## Prompt Engineering Notes

All agents follow these conventions:
- System prompt defines the agent's role and response format
- Responses are always valid JSON
- Chain-of-thought is internal only (never exposed)
- Confidence scores are included in all responses
- Context includes current tasks, preferences, and time

## Switching Models

To use a different model, update the `BEDROCK_MODEL_ID` environment variable:

```bash
# In template.yaml or Lambda configuration
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0     # More capable, higher cost
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0   # Faster, lower cost
```

Ensure the new model is enabled in your Bedrock model access settings.

## Testing Bedrock Access

```bash
aws bedrock-runtime invoke-model \
  --model-id amazon.nova-lite-v1:0 \
  --content-type application/json \
  --accept application/json \
  --body '{"schemaVersion":"messages-v1","messages":[{"role":"user","content":[{"text":"Hello"}]}],"inferenceConfig":{"max_new_tokens":100}}' \
  output.json
```

If this returns successfully, Bedrock is properly configured.
