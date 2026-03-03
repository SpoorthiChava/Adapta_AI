# Step 3: Configure Action Group in Bedrock Agent

Action Groups connect your Lambda functions to your Bedrock agent.

## 3.1 Open Your Bedrock Agent

1. Go to **Amazon Bedrock Console**
2. Click **Agents** in the left menu
3. Click on your agent (the one you already created)
4. You should see tabs: Agent builder, Action groups, Knowledge bases, etc.

---

## 3.2 Create Action Group

1. Click the **Action groups** tab
2. Click **Add action group**

### Basic Information:

- **Action group name**: `ReplanningActions`
- **Description**: `Actions for fetching context and saving replanned tasks`
- **Action group type**: Select **Define with API schemas**

### Action Group Schema:

You need to define the API schema. Click **Define with in-line OpenAPI schema editor**

Paste this OpenAPI schema:

```yaml
openapi: 3.0.0
info:
  title: Adapta Replanning API
  version: 1.0.0
  description: API for fetching user context and saving replanned tasks

paths:
  /getUserContext:
    post:
      summary: Get user context for replanning
      description: Fetches user profile, current tasks, and quiz performance
      operationId: getUserContext
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                userEmail:
                  type: string
                  description: Email of the user
              required:
                - userEmail
      responses:
        '200':
          description: User context retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  userProfile:
                    type: object
                  tasks:
                    type: array
                  quizResults:
                    type: array
                  todayDate:
                    type: string

  /getActiveGoals:
    post:
      summary: Get active learning goals
      description: Fetches active goals with pending tasks and performance metrics
      operationId: getActiveGoals
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                userEmail:
                  type: string
                  description: Email of the user
              required:
                - userEmail
      responses:
        '200':
          description: Active goals retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  activeGoals:
                    type: array
                  todayDate:
                    type: string

  /savePlannedTasks:
    post:
      summary: Save replanned tasks
      description: Saves the newly generated task schedule to database
      operationId: savePlannedTasks
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                userEmail:
                  type: string
                  description: Email of the user
                tasks:
                  type: array
                  description: Array of task objects to save
                  items:
                    type: object
                subjects:
                  type: array
                  description: List of subjects being replanned
                  items:
                    type: string
              required:
                - userEmail
                - tasks
      responses:
        '200':
          description: Tasks saved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  taskCount:
                    type: number
```

### Action Group Executor:

1. Select **Select an existing Lambda function**
2. Choose `adapta-getUserContext` from dropdown
3. **Wait!** This is a limitation - you can only select ONE Lambda per action group

**Solution**: We need to create a Lambda router that calls the appropriate function based on the operation.

---

## 3.3 Create Lambda Router (Required)

Since Bedrock action groups only support one Lambda, we need a router.

### Create New Lambda Function:

1. Go to **Lambda Console** → **Create function**
2. Name: `adapta-bedrock-router`
3. Runtime: Node.js 18.x
4. Role: `adapta-lambda-execution-role`
5. Click **Create**

### Add Router Code:

```javascript
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

exports.handler = async (event) => {
    console.log('Router received:', JSON.stringify(event));
    
    try {
        // Extract the operation from Bedrock agent event
        const apiPath = event.apiPath;
        const parameters = event.requestBody?.content?.['application/json']?.properties || {};
        
        // Map API paths to Lambda functions
        const functionMap = {
            '/getUserContext': 'adapta-getUserContext',
            '/getActiveGoals': 'adapta-getActiveGoals',
            '/savePlannedTasks': 'adapta-savePlannedTasks'
        };
        
        const targetFunction = functionMap[apiPath];
        
        if (!targetFunction) {
            return {
                statusCode: 404,
                body: { error: `Unknown operation: ${apiPath}` }
            };
        }
        
        // Invoke the target Lambda
        const result = await lambda.invoke({
            FunctionName: targetFunction,
            Payload: JSON.stringify({ parameters })
        }).promise();
        
        const response = JSON.parse(result.Payload);
        
        return {
            messageVersion: '1.0',
            response: {
                actionGroup: event.actionGroup,
                apiPath: event.apiPath,
                httpMethod: event.httpMethod,
                httpStatusCode: response.statusCode || 200,
                responseBody: {
                    'application/json': {
                        body: JSON.stringify(response.body)
                    }
                }
            }
        };
        
    } catch (error) {
        console.error('Router error:', error);
        return {
            messageVersion: '1.0',
            response: {
                actionGroup: event.actionGroup,
                apiPath: event.apiPath,
                httpMethod: event.httpMethod,
                httpStatusCode: 500,
                responseBody: {
                    'application/json': {
                        body: JSON.stringify({ error: error.message })
                    }
                }
            }
        };
    }
};
```

### Add Lambda Invoke Permission:

The router needs permission to invoke other Lambdas. Add this inline policy to `adapta-lambda-execution-role`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:*:*:function:adapta-*"
    }
  ]
}
```

---

## 3.4 Complete Action Group Setup

Now go back to your Bedrock agent:

1. In the Action Group configuration
2. **Action group executor**: Select `adapta-bedrock-router`
3. Click **Create**

---

## 3.5 Prepare and Create Agent

1. Click **Prepare** button at the top (this compiles your agent)
2. Wait for "Agent prepared successfully" message
3. Click **Save and exit**

---

## 3.6 Test the Action Group

1. In your agent page, click **Test** button
2. Try this prompt:

```
Get user context for test@example.com
```

3. The agent should call your Lambda and return user data

---

## Troubleshooting

**Error: "Action group not found"**
- Make sure you clicked "Prepare" after creating the action group

**Error: "Lambda invocation failed"**
- Check CloudWatch logs for the router Lambda
- Verify IAM permissions

**Agent doesn't call the action**
- Your agent instructions might need updating
- See `STEP-4-UPDATE-AGENT-INSTRUCTIONS.md`

---

## Next Step
Proceed to `STEP-4-UPDATE-AGENT-INSTRUCTIONS.md`
