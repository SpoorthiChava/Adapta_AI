# Step 5: Integrate Bedrock Agent with Your Backend

Now let's replace Gemini API calls with Bedrock agent calls in your Node.js backend.

## 5.1 Install AWS SDK

In your backend directory:

```bash
cd backend
npm install @aws-sdk/client-bedrock-agent-runtime
```

## 5.2 Set Environment Variables

Add these to your `backend/.env` file:

```env
# AWS Bedrock Configuration
BEDROCK_AGENT_ID=YOUR_AGENT_ID_HERE
BEDROCK_AGENT_ALIAS_ID=TSTALIASID
AWS_REGION=us-east-1

# AWS Credentials (if not using IAM role)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### How to Find Your Agent ID:

1. Go to **Bedrock Console** → **Agents**
2. Click on your agent
3. Copy the **Agent ID** (looks like: `ABCDEFGHIJ`)
4. Copy the **Alias ID** (for testing, use `TSTALIASID`)

## 5.3 Add Bedrock Utility File

Copy `backend-integration/bedrockUtils.js` to your `backend/` folder:

```bash
cp aws-bedrock-setup/backend-integration/bedrockUtils.js backend/
```

## 5.4 Update Planning Engine

You have two options:

### Option A: Replace Entire File (Recommended)

1. Backup your current file:
```bash
cp backend/planningEngine.js backend/planningEngine-gemini-backup.js
```

2. Copy the new Bedrock version:
```bash
cp aws-bedrock-setup/backend-integration/planningEngine-bedrock.js backend/planningEngine.js
```

### Option B: Manual Update

If you have custom logic in your planningEngine.js, manually update just the `ensureOptimalPlan` method:

```javascript
// At the top of the file, add:
const { invokeReplanningAgent } = require('./bedrockUtils');

// Replace the entire ensureOptimalPlan method with:
static async ensureOptimalPlan(userEmail, currentMood = 'okay', force = false) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const onboardingEntries = await getOnboarding(userEmail);

        if (!onboardingEntries || onboardingEntries.length === 0) {
            return { redistributed: false };
        }

        // Check if replanning is needed
        const activeEntries = onboardingEntries.filter(entry => {
            const plan = entry.onboardingData;
            if (!plan) return false;
            if (plan.mode === 'exam' && plan.examDate) {
                return plan.examDate >= todayStr;
            }
            return true;
        });

        if (activeEntries.length === 0) {
            return { redistributed: false };
        }

        const triggeringEntry = activeEntries.find(entry => entry.lastReplanned !== todayStr);
        const needsReplan = !!triggeringEntry || force;

        if (!needsReplan) {
            return { redistributed: false };
        }

        console.log(`[PlanningEngine] Invoking Bedrock agent for ${userEmail}`);

        // BEDROCK CALL - replaces Gemini
        const result = await invokeReplanningAgent(userEmail, currentMood, force);

        if (result.redistributed) {
            const updatedTasks = await getTasks(userEmail);
            return {
                redistributed: true,
                count: updatedTasks.filter(t => t.status === 'pending').length,
                message: result.message
            };
        }

        return { redistributed: false };

    } catch (error) {
        console.error('[PlanningEngine] Error:', error);
        return { error: error.message, redistributed: false };
    }
}
```

## 5.5 Update Lambda Functions with Database Code

Your Lambda functions currently have mock data. Update them with your actual database code.

### Update getUserContext Lambda:

1. Package your database module:
```bash
cd backend
mkdir lambda-package
cp db.js lambda-package/
cp -r node_modules lambda-package/
cd lambda-package
zip -r ../getUserContext.zip .
```

2. Upload to Lambda:
   - Go to Lambda console → `adapta-getUserContext`
   - Click **Upload from** → **.zip file**
   - Upload `getUserContext.zip`

3. Update the handler code to use your actual `db.js`:

```javascript
const { getUserByEmail, getTasks, getQuizResults } = require('./db');

exports.handler = async (event) => {
    const { userEmail } = event.parameters || event;
    
    const user = await getUserByEmail(userEmail);
    const tasks = await getTasks(userEmail);
    const quizResults = await getQuizResults(userEmail);
    
    return {
        statusCode: 200,
        body: {
            userProfile: {
                email: user.email,
                name: user.name,
                dailyHours: user.dailyHours || 4,
                currentStreak: user.currentStreak || 0,
                currentMood: user.currentMood || 'okay'
            },
            tasks: tasks,
            quizResults: quizResults.slice(0, 10),
            todayDate: new Date().toISOString().split('T')[0]
        }
    };
};
```

Repeat for `getActiveGoals` and `savePlannedTasks` Lambdas.

## 5.6 Test the Integration

### Test from Your Backend:

Create a test file `backend/test-bedrock.js`:

```javascript
require('dotenv').config();
const { testBedrockConnection, invokeReplanningAgent } = require('./bedrockUtils');

async function test() {
    console.log('Testing Bedrock connection...');
    const connected = await testBedrockConnection();
    
    if (connected) {
        console.log('\nTesting replanning...');
        const result = await invokeReplanningAgent('test@example.com', 'tired', false);
        console.log('Result:', result);
    }
}

test().catch(console.error);
```

Run it:
```bash
node test-bedrock.js
```

### Test from Your API:

Start your server and call the debug endpoint:

```bash
curl -X POST http://localhost:3001/api/debug/trigger-replan \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","mood":"tired","force":true}'
```

## 5.7 Monitor and Debug

### Check CloudWatch Logs:

1. **Bedrock Agent Logs**: Bedrock Console → Your Agent → View logs
2. **Lambda Logs**: CloudWatch → Log groups → `/aws/lambda/adapta-*`
3. **Backend Logs**: Your server console

### Common Issues:

**Error: "Agent not found"**
- Check BEDROCK_AGENT_ID in .env
- Verify agent is in the same region

**Error: "Access Denied"**
- Check AWS credentials in .env
- Verify IAM permissions for Bedrock

**Error: "Lambda invocation failed"**
- Check Lambda has database connection
- Verify environment variables in Lambda

**Tasks not saving**
- Check savePlannedTasks Lambda logs
- Verify database write permissions

## 5.8 Gradual Rollout (Optional)

To safely transition from Gemini to Bedrock:

```javascript
// In planningEngine.js
const USE_BEDROCK = process.env.USE_BEDROCK === 'true';

static async ensureOptimalPlan(userEmail, currentMood = 'okay', force = false) {
    if (USE_BEDROCK) {
        return this.ensureOptimalPlanBedrock(userEmail, currentMood, force);
    } else {
        return this.ensureOptimalPlanGemini(userEmail, currentMood, force);
    }
}
```

Set `USE_BEDROCK=true` in .env when ready to switch.

## Next Step
Proceed to `STEP-6-TESTING.md`
