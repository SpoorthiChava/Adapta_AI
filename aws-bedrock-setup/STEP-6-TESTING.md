# Step 6: Testing Your Bedrock Agent

Comprehensive testing guide to ensure everything works correctly.

## 6.1 Unit Tests - Lambda Functions

Test each Lambda function individually.

### Test getUserContext:

```bash
# Via AWS CLI
aws lambda invoke \
  --function-name adapta-getUserContext \
  --payload '{"parameters":{"userEmail":"test@example.com"}}' \
  response.json

cat response.json
```

Expected output:
```json
{
  "statusCode": 200,
  "body": {
    "userProfile": { "email": "test@example.com", ... },
    "tasks": [...],
    "quizResults": [...],
    "todayDate": "2024-03-20"
  }
}
```

### Test getActiveGoals:

```bash
aws lambda invoke \
  --function-name adapta-getActiveGoals \
  --payload '{"parameters":{"userEmail":"test@example.com"}}' \
  response.json

cat response.json
```

### Test savePlannedTasks:

```bash
aws lambda invoke \
  --function-name adapta-savePlannedTasks \
  --payload file://test-save-tasks.json \
  response.json
```

Where `test-save-tasks.json`:
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

## 6.2 Integration Test - Bedrock Agent

Test the complete agent workflow.

### Via Bedrock Console:

1. Go to **Bedrock Console** → **Agents** → Your agent
2. Click **Test** button
3. Enter: `Replan schedule for test@example.com who is feeling tired`
4. Observe the agent:
   - Calls getUserContext
   - Calls getActiveGoals
   - Generates task schedule
   - Calls savePlannedTasks
5. Check the response

### Via AWS CLI:

```bash
aws bedrock-agent-runtime invoke-agent \
  --agent-id YOUR_AGENT_ID \
  --agent-alias-id TSTALIASID \
  --session-id test-session-1 \
  --input-text "Replan schedule for test@example.com who is feeling tired" \
  --region us-east-1 \
  response.txt

cat response.txt
```

---

## 6.3 End-to-End Test - Your Backend

Test through your actual API endpoints.

### Test 1: Mood Check Triggers Replan

```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  > token.json

TOKEN=$(cat token.json | jq -r '.token')

# 2. Submit mood (should trigger replan)
curl -X POST http://localhost:3001/api/user/mood \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"mood":"tired"}'

# 3. Check tasks were updated
curl -X GET http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

### Test 2: Manual Replan Trigger

```bash
curl -X POST http://localhost:3001/api/debug/trigger-replan \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","mood":"fresh","force":true}'
```

### Test 3: Login Flow Replan

```bash
# Login should trigger replan if needed
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Then fetch active plan
curl -X GET http://localhost:3001/api/study-plan/active \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6.4 Test Scenarios

### Scenario 1: Tired Mood

**Input**: User feeling tired, has 5 pending math tasks

**Expected**:
- Easier revision tasks scheduled for today
- Complex learning tasks pushed to tomorrow
- aiExplanation mentions being tired
- Total daily time ≤ dailyHours

### Scenario 2: Fresh Mood

**Input**: User feeling fresh, has 5 pending tasks

**Expected**:
- Complex "Core Learning" tasks scheduled for today
- Challenging topics prioritized
- aiExplanation mentions high energy

### Scenario 3: Crunch Mode

**Input**: Exam in 2 days, 10 pending tasks

**Expected**:
- Optional topics dropped (task count < 10)
- High-yield topics prioritized
- Daily time may exceed dailyHours
- Focus on weak topics

### Scenario 4: Multiple Goals

**Input**: Math exam in 5 days, Physics exam in 20 days

**Expected**:
- Math gets ~70% of daily time
- Physics gets ~30%
- Both subjects have tasks scheduled
- Total time ≤ dailyHours (unless crunch mode)

### Scenario 5: Low Performance

**Input**: Recent quiz score 40%, weak topics: Chain rule, Product rule

**Expected**:
- Chain rule and Product rule scheduled soon
- Session type: "Practice" or "Reinforcement Revision"
- More time allocated to weak topics

---

## 6.5 Validation Checklist

After each test, verify:

- [ ] Task count matches totalPendingTasks (or less if crunch mode)
- [ ] Dates are chronological starting from today
- [ ] Date format is YYYY-MM-DD
- [ ] Daily time allocation ≤ dailyHours (unless crunch mode)
- [ ] Mood-appropriate tasks scheduled for today
- [ ] Weak topics are prioritized
- [ ] aiExplanation mentions streak
- [ ] All required fields present in each task
- [ ] Tasks saved to database
- [ ] lastReplanned timestamp updated

---

## 6.6 Performance Testing

### Measure Latency:

```javascript
// In your backend
const start = Date.now();
await PlanningEngine.ensureOptimalPlan(userEmail, mood);
const duration = Date.now() - start;
console.log(`Replanning took ${duration}ms`);
```

**Target**: < 10 seconds for complete replan

### Measure Cost:

Check AWS Cost Explorer:
- Bedrock agent invocations
- Lambda invocations
- CloudWatch logs storage

**Estimate**: ~$0.01-0.05 per replan (depending on model and data size)

---

## 6.7 Error Handling Tests

### Test 1: Invalid User

```bash
curl -X POST http://localhost:3001/api/debug/trigger-replan \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","mood":"okay"}'
```

Expected: Error message, no crash

### Test 2: Database Failure

Temporarily break database connection and test graceful degradation.

### Test 3: Bedrock Timeout

Set Lambda timeout to 3 seconds and test with large dataset.

Expected: Timeout error, lastReplanned still updated to prevent loops

---

## 6.8 Monitoring Setup

### CloudWatch Alarms:

Create alarms for:
- Lambda errors > 5% error rate
- Lambda duration > 25 seconds
- Bedrock throttling errors

### Custom Metrics:

Add to your backend:

```javascript
// Log metrics for monitoring
console.log(JSON.stringify({
  metric: 'replan_duration',
  value: duration,
  userEmail: userEmail,
  mood: mood,
  taskCount: result.count
}));
```

---

## 6.9 Troubleshooting Guide

### Issue: Agent doesn't call actions

**Check**:
- Agent instructions mention calling actions
- Action group is prepared
- Lambda permissions are correct

**Fix**: Update agent instructions to be more explicit

### Issue: Tasks don't match constraints

**Check**:
- Agent instructions are clear
- Temperature is low (0.1-0.3)
- Test data is realistic

**Fix**: Add more examples in instructions, lower temperature

### Issue: Slow performance

**Check**:
- Lambda cold starts
- Database query performance
- Bedrock model choice

**Fix**: Use provisioned concurrency, optimize queries, use faster model

### Issue: High costs

**Check**:
- Number of replans per day
- Model choice (Sonnet vs Haiku)
- Lambda memory allocation

**Fix**: Cache results, use cheaper model, optimize Lambda

---

## Next Step

You're done! Your Bedrock agent is now replacing Gemini for replanning.

### Optional Enhancements:

- Add caching to reduce replans
- Implement A/B testing (Gemini vs Bedrock)
- Add more sophisticated error handling
- Create dashboard for monitoring
- Implement feedback loop for agent improvement

See `OPTIONAL-ENHANCEMENTS.md` for ideas.
