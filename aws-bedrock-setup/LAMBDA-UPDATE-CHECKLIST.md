# Lambda Functions - Final Update Checklist

## All 4 Lambda Functions Need Updates

You need to update ALL 4 Lambda functions with the FINAL versions I created.

---

## 1. adapta-bedrock-router

**File to copy from**: `aws-bedrock-setup/lambda/FINAL-bedrock-router.mjs`

**Steps**:
1. Go to Lambda Console → `adapta-bedrock-router`
2. Delete current `index.mjs` file
3. Create new file named `index.mjs`
4. Copy ALL content from `FINAL-bedrock-router.mjs`
5. Paste into Lambda editor
6. Click **Deploy**

**What this does**: Routes Bedrock agent calls to the correct Lambda function

---

## 2. adapta-getUserContext

**File to copy from**: `aws-bedrock-setup/lambda/FINAL-getUserContext.mjs`

**Steps**:
1. Go to Lambda Console → `adapta-getUserContext`
2. Delete current file (probably `index.js` or `index.mjs`)
3. Create new file named `index.mjs`
4. Copy ALL content from `FINAL-getUserContext.mjs`
5. Paste into Lambda editor
6. Click **Deploy**

**What this does**: Returns user profile, tasks, and quiz results (currently mock data)

---

## 3. adapta-getActiveGoals

**File to copy from**: `aws-bedrock-setup/lambda/FINAL-getActiveGoals.mjs`

**Steps**:
1. Go to Lambda Console → `adapta-getActiveGoals`
2. Delete current file
3. Create new file named `index.mjs`
4. Copy ALL content from `FINAL-getActiveGoals.mjs`
5. Paste into Lambda editor
6. Click **Deploy**

**What this does**: Returns active learning goals with pending tasks (currently mock data with 2 sample goals)

---

## 4. adapta-savePlannedTasks

**File to copy from**: `aws-bedrock-setup/lambda/FINAL-savePlannedTasks.mjs`

**Steps**:
1. Go to Lambda Console → `adapta-savePlannedTasks`
2. Delete current file
3. Create new file named `index.mjs`
4. Copy ALL content from `FINAL-savePlannedTasks.mjs`
5. Paste into Lambda editor
6. Click **Deploy**

**What this does**: Saves replanned tasks (handles Nova's weird format, currently just logs)

---

## Key Changes Made

### All Functions:
- ✅ Changed from `exports.handler` to `export const handler` (ES modules)
- ✅ Changed from `require()` to `import` (ES modules)
- ✅ File extension: `.mjs` (required for ES modules in Node.js 24)

### Router Specific:
- ✅ Parses Bedrock's parameter format correctly (array of objects)
- ✅ Uses AWS SDK v3 syntax

### savePlannedTasks Specific:
- ✅ Handles Nova's output format (`key=value` instead of `"key":"value"`)
- ✅ Gracefully handles parsing errors

---

## After Updating All 4 Functions

Test the complete flow:

```bash
cd backend
node test-bedrock.js
```

**Expected output**:
```
✅ Connection successful!
✅ Replanning test result: { redistributed: true, message: '...' }
```

---

## What's Still Mock Data?

All 3 data functions return mock data:
- `getUserContext` - Returns fake user with 7-day streak
- `getActiveGoals` - Returns 2 fake goals (Math and Physics)
- `savePlannedTasks` - Just logs, doesn't actually save

**Later**: You'll replace the `// TODO` sections with your actual database calls.

---

## Troubleshooting

**If you get errors after updating**:

1. **Check file name**: Must be `index.mjs` (not `index.js`)
2. **Check syntax**: Must use `export const handler` (not `exports.handler`)
3. **Check CloudWatch logs**: See exact error message
4. **Verify all 4 updated**: All must use ES module syntax

---

## Summary

Update these 4 files in AWS Lambda Console:
1. ✅ `adapta-bedrock-router` → `FINAL-bedrock-router.mjs`
2. ✅ `adapta-getUserContext` → `FINAL-getUserContext.mjs`
3. ✅ `adapta-getActiveGoals` → `FINAL-getActiveGoals.mjs`
4. ✅ `adapta-savePlannedTasks` → `FINAL-savePlannedTasks.mjs`

Then test with `node test-bedrock.js`
