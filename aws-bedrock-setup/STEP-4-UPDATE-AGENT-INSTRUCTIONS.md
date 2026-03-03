# Step 4: Update Agent Instructions

Now that your action group is set up, update your agent's instructions to use it properly.

## 4.1 Open Agent Instructions

1. Go to your Bedrock agent
2. Click **Agent builder** tab
3. Find the **Instructions** section

---

## 4.2 Replace with This Prompt

Delete your current instructions and paste this:

```
You are a study planning agent for Adapta. Your job is to replan student schedules across multiple learning goals.

WORKFLOW:
1. When asked to replan for a user, FIRST call getUserContext and getActiveGoals to fetch data
2. Analyze the data and generate a new task schedule
3. THEN call savePlannedTasks to save the results

MOOD STATES:
- FRESH: Schedule complex "Core Learning" topics TODAY
- TIRED/STRESSED: Schedule easy "Reinforcement Revision" TODAY
- CALM/OKAY: Standard progression

CONSTRAINTS (MANDATORY):
1. Output task count MUST match totalPendingTasks for each subject
   - EXCEPTION: Exam crunch mode (<3 days) can drop optional topics
2. SKILL mode: Preserve all tasks, shift missed tasks forward from today
3. EXAM mode: Respect deadline, prioritize weak topics if performanceIndex <60%
4. Daily time: Respect dailyHours (exception: crunch mode can exceed)
5. Priority: Exams <7 days away get 70% of daily capacity
6. Minimum: 30-45 mins per subject daily
7. Sessions: 45-90 mins each

MOOD DISTRIBUTION:
- FRESH: Most complex subtopics today
- TIRED/STRESSED: Easier revision today
- Always acknowledge user's streak in aiExplanation

TASK FORMAT:
Each task must have:
- subject: exact subject name from input
- topic: string
- subtopic: string
- duration: "45 mins" format
- date: "YYYY-MM-DD" format
- sessionType: "Core Learning" | "Practice" | "Active Revision" | "Reinforcement Revision" | "Comfort Revision"
- aiExplanation: why scheduled now, mention streak
- status: "pending"

IMPORTANT:
- Ensure chronological dates starting from today
- Balance theory and practice
- Logical topic progression (basics before advanced)
- Group related subtopics on same day when possible

When you generate the task schedule, immediately call savePlannedTasks to persist it.
```

---

## 4.3 Configure Model Settings

While you're here, verify these settings:

### Model:
- **Model**: Claude 3 Sonnet or Claude 3.5 Sonnet (recommended)
- **Temperature**: 0.3 (for consistent planning)
- **Top P**: 0.9
- **Max tokens**: 4096

### Advanced Settings:
- **Enable memory**: OFF (not needed for this use case)
- **Enable guardrails**: Optional (add content filters if needed)

---

## 4.4 Prepare Agent Again

After updating instructions:

1. Click **Prepare** button at the top
2. Wait for success message
3. Click **Save**

---

## 4.5 Test the Complete Flow

Now test the full replanning workflow:

### Test Prompt:

```
Replan schedule for user test@example.com who is feeling tired today.
```

### Expected Behavior:

1. Agent calls `getUserContext` to get user data
2. Agent calls `getActiveGoals` to get learning goals
3. Agent analyzes the data
4. Agent generates new task schedule
5. Agent calls `savePlannedTasks` to save tasks
6. Agent responds with summary

### Check the Response:

The agent should respond with something like:

```
I've successfully replanned the schedule for test@example.com. Here's what I did:

Since the user is feeling tired today, I scheduled easier revision tasks for today:
- Reinforcement Revision: Chain rule (60 mins) - addressing a weak topic
- Light practice session (45 mins)

For tomorrow and beyond, I've scheduled more intensive learning sessions when energy is higher.

Total tasks scheduled: 8
Subjects covered: A-Level Mathematics, A-Level Physics
Daily time allocation: ~4 hours (respecting the user's capacity)

The schedule maintains the user's 7-day streak and prioritizes weak topics identified from recent quizzes.
```

---

## 4.6 Check CloudWatch Logs

Verify everything worked:

1. Go to **CloudWatch** → **Log groups**
2. Find logs for:
   - `/aws/lambda/adapta-bedrock-router`
   - `/aws/lambda/adapta-getUserContext`
   - `/aws/lambda/adapta-getActiveGoals`
   - `/aws/lambda/adapta-savePlannedTasks`
3. Check for errors

---

## Troubleshooting

**Agent doesn't call actions**
- Make sure you clicked "Prepare" after updating instructions
- Try being more explicit: "Call getUserContext for test@example.com"

**Agent calls actions but gets errors**
- Check CloudWatch logs for the specific Lambda
- Verify database connections in Lambda code

**Agent generates tasks but doesn't save them**
- Add explicit instruction: "After generating tasks, call savePlannedTasks"
- Check if savePlannedTasks Lambda has database write permissions

**Tasks don't match constraints**
- Lower temperature to 0.1 for more consistent outputs
- Add more explicit examples in instructions

---

## Next Step
Proceed to `STEP-5-BACKEND-INTEGRATION.md`
