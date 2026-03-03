# Step 1: Create IAM Roles

## 1.1 Create Lambda Execution Role

This role allows Lambda functions to access your database and CloudWatch logs.

### Via AWS Console:

1. Go to **IAM Console** → **Roles** → **Create role**
2. Select **AWS service** → **Lambda**
3. Click **Next**
4. Attach these policies:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
   - Create custom policy for database access (see below)
5. Name: `adapta-lambda-execution-role`
6. Click **Create role**

### Custom Database Policy:

If using DynamoDB, attach this inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/adapta-*"
    }
  ]
}
```

If using RDS/other database, you'll need appropriate permissions.

## 1.2 Create Bedrock Agent Role

This role allows your Bedrock agent to invoke Lambda functions.

### Via AWS Console:

1. Go to **IAM Console** → **Roles** → **Create role**
2. Select **AWS service** → **Bedrock**
3. Select **Bedrock - Agent** as use case
4. Click **Next**
5. Attach policy: `AmazonBedrockFullAccess`
6. Add inline policy for Lambda invocation:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:*:*:function:adapta-*"
    }
  ]
}
```

7. Name: `adapta-bedrock-agent-role`
8. Click **Create role**

## 1.3 Note Your Role ARNs

After creating both roles, copy their ARNs. You'll need them later:

- Lambda Role ARN: `arn:aws:iam::YOUR_ACCOUNT:role/adapta-lambda-execution-role`
- Bedrock Agent Role ARN: `arn:aws:iam::YOUR_ACCOUNT:role/adapta-bedrock-agent-role`

## Next Step
Proceed to `STEP-2-LAMBDA-FUNCTIONS.md`
