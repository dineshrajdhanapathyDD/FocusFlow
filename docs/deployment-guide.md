# Deployment Guide

## Prerequisites

1. **AWS Account** with Free Tier eligibility
2. **AWS CLI** installed and configured (`aws configure`)
3. **AWS SAM CLI** installed ([Install guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
4. **Node.js 20+** installed
5. **Amazon Bedrock** - Enable the Nova Lite model in your AWS region

## Step 1: Enable Bedrock Model Access

1. Open the [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Go to **Model access** in the left sidebar
3. Click **Manage model access**
4. Enable **Amazon Nova Lite** (amazon.nova-lite-v1:0)
5. Wait for access to be granted (usually instant)

## Step 2: Deploy Backend Infrastructure

```bash
# Build the backend
cd backend
npm install
npm run build

# Deploy with SAM
cd ../infrastructure
sam build
sam deploy --guided
```

During guided deployment, you'll be prompted for:
- **Stack Name**: `focusflow-dev`
- **Region**: `us-east-1` (or your preferred region)
- **Environment**: `dev`
- **UserPoolId**: Leave empty (creates new Cognito pool)

Note the outputs:
- `ApiUrl` - Your API Gateway endpoint
- `UserPoolId` - Cognito User Pool ID
- `UserPoolClientId` - Cognito Client ID

## Step 3: Deploy Frontend

### Option A: AWS Amplify Hosting (Recommended)

1. Push code to a Git repository (GitHub, CodeCommit, etc.)
2. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
3. Click **New app** > **Host web app**
4. Connect your repository and select the branch
5. Amplify auto-detects `amplify.yml` build settings
6. Add environment variables:
   - `VITE_API_URL` = API Gateway URL from Step 2
   - `VITE_COGNITO_USER_POOL_ID` = from Step 2
   - `VITE_COGNITO_CLIENT_ID` = from Step 2
7. Deploy

### Option B: Manual Build + S3

```bash
cd frontend
echo "VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev" > .env
npm install
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete
```

## Step 4: Configure CORS (if needed)

The SAM template already configures CORS for `*`. For production, restrict the `AllowOrigin` in `template.yaml` to your Amplify domain:

```yaml
AllowOrigin: "'https://your-app.amplifyapp.com'"
```

Then redeploy: `sam deploy`

## Step 5: Create First User

With Cognito deployed:
1. Open the app in your browser
2. Click **Sign Up** and create an account
3. Check your email for the verification code
4. Verify and sign in

Or use the demo mode (works without Cognito):
- Email: `demo@focusflow.ai`
- Password: `demo123`

## Updating the Application

### Backend changes
```bash
cd backend && npm run build
cd ../infrastructure && sam deploy
```

### Frontend changes
If using Amplify, push to your repository. Amplify auto-deploys.

If using S3: `cd frontend && npm run build && aws s3 sync dist/ s3://bucket`

## Monitoring

- **CloudWatch Logs**: Each Lambda has a log group at `/aws/lambda/focusflow-*`
- **Structured logging**: All logs are JSON-formatted for easy querying
- **X-Ray tracing**: Enabled on API Gateway

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check AllowOrigin in template.yaml matches your domain |
| 401 Unauthorized | Verify Cognito token is valid and not expired |
| Bedrock timeout | Increase Lambda timeout (currently 60s for AI function) |
| DynamoDB errors | Check IAM policies allow the operation on the table |
| Cold starts | First request may be slow; consider Provisioned Concurrency for prod |

## Production Checklist

- [ ] Set `Environment` parameter to `prod`
- [ ] Restrict CORS to specific domain
- [ ] Enable WAF on API Gateway
- [ ] Set up CloudWatch Alarms for errors
- [ ] Configure DynamoDB backups
- [ ] Review IAM policies for least privilege
- [ ] Enable Cognito MFA
- [ ] Set up custom domain with ACM certificate
- [ ] Configure Amplify branch protection
