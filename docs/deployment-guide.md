# Deployment Guide

## Prerequisites

- **AWS Account** (Free Tier eligible)
- **AWS CLI** configured (`aws configure`)
- **AWS CDK CLI** installed (`npm install -g aws-cdk`)
- **Node.js 20+**
- **Amazon Bedrock** — Nova Lite model enabled in us-east-1

## Current Deployment

| Resource | Value |
|----------|-------|
| API Gateway | `https://utp50r9qdd.execute-api.us-east-1.amazonaws.com/dev/` |
| Cognito User Pool | `us-east-1_X800aMS5o` |
| Cognito Client ID | `6spocspt7tkca199buhbi4rjmh` |
| Region | `us-east-1` |
| Stack Name | `FocusFlowStack` |

## Step 1: Enable Bedrock Model Access

1. Open [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock/) (us-east-1)
2. Go to **Model access** → **Manage model access**
3. Enable **Amazon Nova Lite** → Request access
4. Wait for approval (usually instant)

## Step 2: Build Backend

```bash
cd backend
npm install
npm run build   # Compiles TypeScript to dist/
```

## Step 3: Deploy Infrastructure (CDK)

```bash
cd infrastructure/cdk
npm install
npx tsc          # Compile CDK stack

# First time: bootstrap CDK in your account
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1

# Deploy
cdk deploy --require-approval never
```

**Outputs after deploy:**
- `ApiUrl` — Your API Gateway endpoint
- `UserPoolId` — Cognito User Pool ID
- `UserPoolClientId` — Cognito Client ID

## Step 4: Deploy Frontend (Amplify)

### Option A: Auto-deploy via GitHub (Recommended)

1. Push code to GitHub
2. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
3. **New app** → **Host web app** → Connect GitHub repo
4. Amplify detects `amplify.yml` with `appRoot: frontend`
5. Add environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev/api` |
| `VITE_COGNITO_USER_POOL_ID` | From CDK output |
| `VITE_COGNITO_CLIENT_ID` | From CDK output |
| `VITE_COGNITO_REGION` | `us-east-1` |

6. Deploy — Amplify builds and hosts automatically

### Option B: Manual Build

```bash
cd frontend
npm install

# Create .env with your values
echo "VITE_API_URL=https://YOUR_API.execute-api.us-east-1.amazonaws.com/dev/api" > .env

npm run build
# Upload dist/ to S3 + CloudFront, or any static host
```

## Step 5: Configure SES (for OTP emails)

The OTP system works in **dev mode** without SES (code is auto-filled). For real email delivery:

1. Go to **SES Console** → **Verified identities**
2. Verify your sender email or domain
3. **Request production access** (to send to any email)
4. Set `SES_PRODUCTION=true` in the CreateAuthChallenge Lambda environment

Until SES is in production mode, the OTP code is returned to the frontend and auto-filled.

## Updating the Application

### Backend changes:
```bash
cd backend && npm run build
cd ../infrastructure/cdk && cdk deploy --require-approval never
```

### Frontend changes:
Push to GitHub → Amplify auto-deploys.

### Force Lambda update (if CDK caches):
```bash
# Find latest asset zip
aws s3 ls s3://cdk-hnb659fds-assets-ACCOUNT-us-east-1/ | Select-String ".zip" | Sort-Object | Select-Object -Last 1

# Update all functions
$key = "LATEST_KEY.zip"
foreach ($fn in @("focusflow-auth-dev","focusflow-tasks-dev","focusflow-ai-dev","focusflow-planner-dev","focusflow-analytics-dev","focusflow-notifications-dev")) {
  aws lambda update-function-code --function-name $fn --region us-east-1 --s3-bucket cdk-hnb659fds-assets-ACCOUNT-us-east-1 --s3-key $key
}
```

## Stack Resources Created

| Resource | Name | Type |
|----------|------|------|
| API Gateway | focusflow-api-dev | REST API |
| Lambda x6 | focusflow-{auth,tasks,ai,planner,analytics,notifications}-dev | Node.js 20 ARM64 |
| Lambda x4 | focusflow-cognito-{pre-signup,define-auth,create-auth,verify-auth} | Cognito triggers |
| DynamoDB x4 | FocusFlow-{Tasks,Plans,Insights,Notifications}-dev | PAY_PER_REQUEST |
| Cognito | focusflow-users-dev | User Pool + Client |
| CloudWatch | /aws/lambda/focusflow-* | Log groups (14-day retention) |

## Monitoring

- **Lambda logs:** CloudWatch → `/aws/lambda/focusflow-*-dev`
- **All logs are structured JSON** — easy to query with CloudWatch Insights
- **API Gateway:** Metrics available in CloudWatch

Example CloudWatch Insights query:
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

## Destroy (Cleanup)

```bash
cd infrastructure/cdk
cdk destroy
```

> Note: DynamoDB tables with `RETAIN` policy won't be deleted. Remove manually if needed.

## Production Checklist

- [ ] Enable Bedrock Nova Lite model access
- [ ] Request SES production access for real OTP emails
- [ ] Set `SES_PRODUCTION=true` on CreateAuthChallenge Lambda
- [ ] Restrict CORS to your Amplify domain
- [ ] Add custom domain with ACM certificate
- [ ] Enable Cognito MFA (optional)
- [ ] Set up CloudWatch Alarms for errors
- [ ] Review Lambda concurrency limits

---

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Amazon Bedrock Setup](./bedrock-setup.md)
- [MCP + Strands Guide](./mcp-strands-guide.md)
- [Project Article](./article.md)
