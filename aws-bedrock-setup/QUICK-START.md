# Quick Start Guide - 30 Minutes to Bedrock Agent

Follow these steps in order. Each should take ~5-10 minutes.

## Prerequisites Checklist

- [ ] AWS account with Bedrock access enabled
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js installed
- [ ] Your Adapta backend running locally
- [ ] Basic Bedrock agent already created (you mentioned you have this)

---

## Step 1: Create IAM Roles (10 min)

### Lambda Execution Role:

```bash
# Create role
aws iam create-role \
  --role-name adapta-lambda-execution-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name adapta-lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Add Lambda invoke permission
aws iam put-role-policy \
  --role-name adapta-lambda-execution-role \
  --policy-name LambdaInvokePolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:*:*:function:adapta-*"
    }]
  }'
```

---

## Step 2: Create Lambda Functions (10 min)

### Create Router Lambda:

```bash
# Create function
aws lambda create-function \
  --function-name adapta-bedrock-router \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/adapta-lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://lambda-router.zip \
  --timeout 30

# Note: You need to create lambda-router.zip first
# See lambda/router/ folder for code
```

**Easier via Console**:
1. Go to Lambda Console → Create function
2. Name: `adapta-bedrock-router`
3. Runtime: Node.js 18.x
4. Role: `adapta-lambda-execution-role`
5. Copy code from `lambda/router/index.js`
6. Set timeout to 30 seconds

Repeat for:
- `adapta-getUserContext` (code in `lambda/getUserContext/`)
- `adapta-getActiveGoals` (code in `lambda/getActiveGoals/`)
- `adapta-savePlannedTasks` (code in `lambda/savePlannedTasks/`)

---

## Step 3: Configure Your Existing Agent (5 min)

### Update Agent Instructions:

1. Go to Bedrock Console → Agents → Your agent
2. Click **Agent builder** tab
3. Replace instructions with the prompt from `STEP-4-UPDATE-AGENT-INSTRUCTIONS.md`
4. Click **Prepare**

### Add Action Group:

1. Click **Action groups** tab → **Add action group**
2. Name: `ReplanningActions`
3. Type: **Define with API schemas**
4. Paste OpenAPI schema from `STEP-3-ACTION-GROUP.md`
5. Executor: Select `adapta-bedrock-router`
6. Click **Create**
7. Click **Prepare** again

---

## Step 4: Integrate with Backend (5 min)

### Install SDK:

```bash
cd backend
npm install @aws-sdk/client-bedrock-agent-runtime
```

### Add Environment Variables:

Add to `backend/.env`:

```env
BEDROCK_AGENT_ID=YOUR_AGENT_ID
BEDROCK_AGENT_ALIAS_ID=TSTALIASID
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### Copy Files:

```bash
cp aws-bedrock-setup/backend-integration/bedrockUtils.js backend/
cp backend/planningEngine.js backend/planningEngine-backup.js
cp aws-bedrock-setup/backend-integration/planningEngine-bedrock.js backend/planningEngine.js
```

---

## Step 5: Test (5 min)

### Test Lambda:

```bash
aws lambda invoke \
  --function-name adapta-getUserContext \
  --payload '{"parameters":{"userEmail":"test@example.com"}}' \
  response.json

cat response.json
```

### Test Agent:

In Bedrock Console → Your agent → Test:

```
Replan schedule for test@example.com who is feeling tired
```

### Test Backend:

```bash
# Start your server
npm start

# In another terminal
curl -X POST http://localhost:3001/api/debug/trigger-replan \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","mood":"tired","force":true}'
```

---

## Troubleshooting

### "Agent not found"
- Check BEDROCK_AGENT_ID in .env matches your agent ID

### "Lambda invocation failed"
- Check Lambda has correct IAM role
- Check CloudWatch logs: `/aws/lambda/adapta-bedrock-router`

### "Access Denied"
- Verify AWS credentials in .env
- Check IAM permissions for Bedrock

### "Tasks not saving"
- Update Lambda functions with your actual database code
- Check database connection in Lambda

---

## What's Next?

1. **Update Lambda functions** with your real database code (currently using mocks)
2. **Test all scenarios** from `STEP-6-TESTING.md`
3. **Monitor performance** in CloudWatch
4. **Gradually roll out** to production users

---

## Need Help?

- Detailed steps: See `STEP-1-IAM-SETUP.md` through `STEP-6-TESTING.md`
- Lambda code: See `lambda/` folder
- Backend integration: See `backend-integration/` folder
- Test data: See `test-payloads/` folder

---

## Cost Estimate

- Lambda: ~$0.0001 per invocation
- Bedrock: ~$0.01-0.05 per replan (depending on model)
- CloudWatch: ~$0.50/month for logs

**Total**: ~$5-20/month for 100 users with daily replans
