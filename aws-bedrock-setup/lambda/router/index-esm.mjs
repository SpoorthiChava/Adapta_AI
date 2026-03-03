/**
 * Lambda Router for Bedrock Agent (ES Module)
 * 
 * Routes action group calls to the appropriate Lambda function.
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});

export const handler = async (event) => {
    console.log('Router received event:', JSON.stringify(event, null, 2));
    
    try {
        // Extract operation details from Bedrock agent event
        const apiPath = event.apiPath;
        const httpMethod = event.httpMethod;
        const requestBody = event.requestBody?.content?.['application/json'];
        
        // Extract parameters from Bedrock format
        let parameters = {};
        if (requestBody && requestBody.properties) {
            // Bedrock sends parameters as array: [{ name: "userEmail", type: "string", value: "test@example.com" }]
            if (Array.isArray(requestBody.properties)) {
                requestBody.properties.forEach(prop => {
                    parameters[prop.name] = prop.value;
                });
            } else {
                // Fallback for object format
                parameters = requestBody.properties;
            }
        }
        
        console.log('API Path:', apiPath);
        console.log('Parameters:', JSON.stringify(parameters));
        
        // Map API paths to Lambda functions
        const functionMap = {
            '/getUserContext': 'adapta-getUserContext',
            '/getActiveGoals': 'adapta-getActiveGoals',
            '/savePlannedTasks': 'adapta-savePlannedTasks'
        };
        
        const targetFunction = functionMap[apiPath];
        
        if (!targetFunction) {
            console.error('Unknown API path:', apiPath);
            return formatResponse(event, 404, {
                error: `Unknown operation: ${apiPath}`
            });
        }
        
        console.log('Invoking Lambda:', targetFunction);
        
        // Invoke the target Lambda function
        const command = new InvokeCommand({
            FunctionName: targetFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({ parameters })
        });
        
        const result = await lambda.send(command);
        
        console.log('Lambda invocation result:', result);
        
        // Parse the response
        const payloadString = new TextDecoder().decode(result.Payload);
        let response;
        try {
            response = JSON.parse(payloadString);
        } catch (e) {
            console.error('Failed to parse Lambda response:', e);
            return formatResponse(event, 500, {
                error: 'Invalid response from Lambda function'
            });
        }
        
        // Check for Lambda errors
        if (result.FunctionError) {
            console.error('Lambda function error:', response);
            return formatResponse(event, 500, {
                error: 'Lambda function failed',
                details: response
            });
        }
        
        // Return formatted response for Bedrock agent
        return formatResponse(
            event,
            response.statusCode || 200,
            response.body || response
        );
        
    } catch (error) {
        console.error('Router error:', error);
        return formatResponse(event, 500, {
            error: 'Router failed',
            message: error.message,
            stack: error.stack
        });
    }
};

/**
 * Format response for Bedrock agent
 */
function formatResponse(event, statusCode, body) {
    return {
        messageVersion: '1.0',
        response: {
            actionGroup: event.actionGroup,
            apiPath: event.apiPath,
            httpMethod: event.httpMethod,
            httpStatusCode: statusCode,
            responseBody: {
                'application/json': {
                    body: JSON.stringify(body)
                }
            }
        }
    };
}
