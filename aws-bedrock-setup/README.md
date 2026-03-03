# AWS Bedrock Agent Setup for Adapta Replanning

This guide will help you replace Gemini API with AWS Bedrock Agent for task replanning.

## Overview

You'll create:
1. **3 Lambda Functions** - To fetch data and save results
2. **1 Action Group** - To connect Lambda functions to your Bedrock agent
3. **Backend Integration** - Node.js code to call the Bedrock agent

## Prerequisites

- AWS Account with Bedrock access
- AWS CLI installed and configured
- Node.js installed
- Your existing Bedrock agent created

## Setup Steps

### Step 1: Create IAM Roles
See `iam-policies/` folder for role definitions.

### Step 2: Deploy Lambda Functions
See `lambda/` folder for function code.

### Step 3: Configure Action Group
Instructions in `action-group-setup.md`

### Step 4: Update Your Backend
Replace Gemini calls with Bedrock agent calls using code in `backend-integration/`

### Step 5: Test
Use test payloads in `test-payloads/` folder

## Estimated Time
- Lambda setup: 20 minutes
- Action group config: 10 minutes
- Backend integration: 15 minutes
- Testing: 10 minutes

**Total: ~1 hour**

## Next Steps
Start with `STEP-1-IAM-SETUP.md`
