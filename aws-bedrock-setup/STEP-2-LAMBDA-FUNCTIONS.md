# Step 2: Create Lambda Functions

You'll create 3 Lambda functions that your Bedrock agent will call.

## 2.1 Create getUserContext Lambda

### Via AWS Console:

1. Go to **Lambda Console** → **Create function**
2. Choose **Author from scratch**
3. Function name: `adapta-getUserContext`
4. Runtime: **Node.js 18.x** (or latest)
5. Architecture: **x86_64**
6. Execution role: **Use an existing role** → Select `adapta-lambda-execution-role`
7. Click **Create function**

### Add Code:

1. In the function page, scroll to **Code source**
2. Delete the default code
3. Copy the code from `lambda/getUserContext/index.js`
4. Paste it into the editor
5. Click **Deploy**

### Configure:

1. Go to **Configuration** → **General configuration** → **Edit**
2. Set **Timeout** to **30 seconds**
3. Click **Save**

### Important: Update Database Calls

Open the code and replace the TODO sections with your actual database calls:

```javascript
// Replace this:
const user = { /* mock data */ };

// With your actual DB call:
const { getUserByEmail, getTasks, getQuizResults } = require('./db');
const user = await getUserByEmail(userEmail);
const tasks = await getTasks(userEmail);
const quizResults = await getQuizResults(userEmail);
```

You'll need to package your database module with the Lambda function.

---

## 2.2 Create getActiveGoals Lambda

Repeat the same process:

1. **Create function**: `adapta-getActiveGoals`
2. **Runtime**: Node.js 18.x
3. **Role**: `adapta-lambda-execution-role`
4. **Code**: Copy from `lambda/getActiveGoals/index.js`
5. **Timeout**: 30 seconds
6. **Update database calls** in the code

---

## 2.3 Create savePlannedTasks Lambda

Repeat the same process:

1. **Create function**: `adapta-savePlannedTasks`
2. **Runtime**: Node.js 18.x
3. **Role**: `adapta-lambda-execution-role`
4. **Code**: Copy from `lambda/savePlannedTasks/index.js`
5. **Timeout**: 30 seconds
6. **Update database calls** in the code

---

## 2.4 Test Your Lambda Functions

### Test getUserContext:

1. In the Lambda console, click **Test** tab
2. Create new test event:

```json
{
  "parameters": {
    "userEmail": "test@example.com"
  }
}
```

3. Click **Test**
4. Check the response - should return user profile, tasks, and quiz results

### Test getActiveGoals:

```json
{
  "parameters": {
    "userEmail": "test@example.com"
  }
}
```

### Test savePlannedTasks:

```json
{
  "parameters": {
    "userEmail": "test@example.com",
    "tasks": [
      {
        "subject": "Mathematics",
        "topic": "Calculus",
        "subtopic": "Differentiation",
        "duration": "60 mins",
        "date": "2024-03-25",
        "sessionType": "Core Learning",
        "aiExplanation": "Test task",
        "status": "pending"
      }
    ]
  }
}
```

---

## 2.5 Note Your Lambda ARNs

After creating all functions, copy their ARNs:

- getUserContext ARN: `arn:aws:lambda:REGION:ACCOUNT:function:adapta-getUserContext`
- getActiveGoals ARN: `arn:aws:lambda:REGION:ACCOUNT:function:adapta-getActiveGoals`
- savePlannedTasks ARN: `arn:aws:lambda:REGION:ACCOUNT:function:adapta-savePlannedTasks`

You'll need these in the next step.

---

## Troubleshooting

**Error: "Task timed out after 3.00 seconds"**
- Increase timeout in Configuration → General configuration

**Error: "Cannot find module 'db'"**
- You need to package your database module with the Lambda
- See `PACKAGING-LAMBDA.md` for instructions

**Error: "Access Denied"**
- Check IAM role has correct permissions for your database

---

## Next Step
Proceed to `STEP-3-ACTION-GROUP.md`
