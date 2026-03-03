/**
 * AWS Bedrock Agent Integration for Adapta
 * 
 * This replaces the Gemini API calls in planningEngine.js
 */

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

// Configuration
const BEDROCK_AGENT_ID = process.env.BEDROCK_AGENT_ID || 'YOUR_AGENT_ID';
const BEDROCK_AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID'; // Test alias
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize Bedrock client
const bedrockClient = new BedrockAgentRuntimeClient({
    region: AWS_REGION,
    // Credentials will be loaded from environment or IAM role
});

/**
 * Invoke Bedrock agent for replanning
 * @param {string} userEmail - User's email
 * @param {string} currentMood - User's current mood
 * @param {boolean} force - Force replanning even if already done today
 * @returns {Promise<Object>} Replanning result
 */
async function invokeReplanningAgent(userEmail, currentMood = 'okay', force = false) {
    try {
        console.log(`[Bedrock] Invoking replanning agent for ${userEmail}, mood: ${currentMood}, force: ${force}`);
        
        // Create the prompt for the agent
        const prompt = `Replan schedule for user ${userEmail} who is feeling ${currentMood} today.${force ? ' This is a forced replan.' : ''}`;
        
        // Prepare the command
        const command = new InvokeAgentCommand({
            agentId: BEDROCK_AGENT_ID,
            agentAliasId: BEDROCK_AGENT_ALIAS_ID,
            sessionId: `session-${userEmail}-${Date.now()}`, // Unique session per request
            inputText: prompt,
            enableTrace: true, // Enable for debugging
        });
        
        // Invoke the agent
        const response = await bedrockClient.send(command);
        
        // Process the streaming response
        let fullResponse = '';
        let traces = [];
        
        if (response.completion) {
            for await (const event of response.completion) {
                if (event.chunk) {
                    const chunk = new TextDecoder().decode(event.chunk.bytes);
                    fullResponse += chunk;
                }
                
                if (event.trace) {
                    traces.push(event.trace);
                    console.log('[Bedrock Trace]:', JSON.stringify(event.trace, null, 2));
                }
            }
        }
        
        console.log('[Bedrock] Agent response:', fullResponse);
        
        // Parse the response
        // The agent should have already called savePlannedTasks
        // So we just need to return success
        
        return {
            redistributed: true,
            message: fullResponse,
            traces: traces
        };
        
    } catch (error) {
        console.error('[Bedrock] Error invoking agent:', error);
        
        // Log detailed error
        if (error.$metadata) {
            console.error('[Bedrock] Error metadata:', error.$metadata);
        }
        
        throw new Error(`Bedrock agent invocation failed: ${error.message}`);
    }
}

/**
 * Test connection to Bedrock agent
 * @returns {Promise<boolean>} True if connection successful
 */
async function testBedrockConnection() {
    try {
        console.log('[Bedrock] Testing connection...');
        console.log('[Bedrock] Agent ID:', BEDROCK_AGENT_ID);
        console.log('[Bedrock] Region:', AWS_REGION);
        
        const command = new InvokeAgentCommand({
            agentId: BEDROCK_AGENT_ID,
            agentAliasId: BEDROCK_AGENT_ALIAS_ID,
            sessionId: `test-${Date.now()}`,
            inputText: 'Hello, are you working?',
        });
        
        const response = await bedrockClient.send(command);
        
        let hasResponse = false;
        if (response.completion) {
            for await (const event of response.completion) {
                if (event.chunk) {
                    hasResponse = true;
                    break;
                }
            }
        }
        
        console.log('[Bedrock] Connection test:', hasResponse ? 'SUCCESS' : 'FAILED');
        return hasResponse;
        
    } catch (error) {
        console.error('[Bedrock] Connection test failed:', error.message);
        return false;
    }
}

module.exports = {
    invokeReplanningAgent,
    testBedrockConnection
};
