# Fix IAM Permissions for Lambda Router

## Problem
Your Lambda router (`adapta-bedrock-router`) cannot invoke the other Lambda functions because the IAM role is missing the `lambda:InvokeFunction` permission.

**Error**: `User: arn:aws:sts::241371257247:assumed-role/adapta-lambda-execution-role/adapta-bedrock-router is not authorized to perform: lambda:InvokeFunction`

---

## Solution: Add Inline Policy to IAM Role

### Step 1: Go to IAM Console
1. Open AWS Console
2. Search for "IAM" and click on it
3. Click "Roles" in the left sidebar
4. Find and click on `adapta-lambda-execution-role`

### Step 2: Add Inline Policy
1. Click the "Permissions" tab
2. Click "Add permissions" dropdown
3. Select "Create inline policy"
4. Click the "JSON" tab
5. **Delete everything** in the editor
6. **Paste this exact policy**:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "lambda:InvokeFunction",
            "Resource": [
                "arn:aws:lambda:us-east-1:241371257247:function:adapta-getUserContext",
                "arn:aws:lambda:us-east-1:241371257247:function:adapta-getActiveGoals",
                "arn:aws:lambda:us-east-1:241371257247:function:adapta-savePlannedTasks"
            ]
        }
    ]
}
```

7. Click "Next"
8. For policy name, enter: `LambdaInvokePolicy`
9. Click "Create policy"

### Step 3: Verify
After adding the policy, you should see TWO policies attached to the role:
- ✅ `AWSLambdaBasicExecutionRole` (AWS managed)
- ✅ `LambdaInvokePolicy` (Inline policy you just created)

---

## Test After Fixing

Once you've added the inline policy, test again:

```cmd
cd backend
node test-bedrock.js
```

**Expected output**:
```
✅ Connection successful!
✅ Replanning test result: { redistributed: true, ... }
```

---

## Why This Happened

When you created the IAM role earlier, you might have:
1. Only attached the `AWSLambdaBasicExecutionRole` policy (for CloudWatch logs)
2. Forgot to add the inline policy for invoking other Lambda functions

The inline policy is REQUIRED for the router Lambda to call the other 3 Lambda functions.

---

## Alternative: Use AWS CLI (if you prefer)

If you want to use the command line instead:

```cmd
aws iam put-role-policy --role-name adapta-lambda-execution-role --policy-name LambdaInvokePolicy --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":\"lambda:InvokeFunction\",\"Resource\":[\"arn:aws:lambda:us-east-1:241371257247:function:adapta-getUserContext\",\"arn:aws:lambda:us-east-1:241371257247:function:adapta-getActiveGoals\",\"arn:aws:lambda:us-east-1:241371257247:function:adapta-savePlannedTasks\"]}]}"
```

---

## Next Steps After This Works

Once the test passes:
1. ✅ Lambda functions are working
2. ✅ Bedrock agent can call them
3. 🔄 Replace mock data with real database calls
4. 🔄 Switch from Gemini to Bedrock in production
