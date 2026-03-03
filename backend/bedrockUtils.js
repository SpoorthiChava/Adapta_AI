/**
 * AWS Bedrock Agent Integration for Adapta
 * 
 * This replaces the Gemini API calls in planningEngine.js
 */

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

// Configuration
const BEDROCK_AGENT_ID = process.env.BEDROCK_AGENT_ID || 'YOUR_AGENT_ID';
const BEDROCK_AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize Bedrock client
const bedrockClient = new BedrockAgentRuntimeClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Invoke Bedrock agent for replanning
 * @param {string} userEmail - User's email
 * @param {string} currentMood - User's current mood
 * @param {boolean} force - Force replanning even if already done today
 * @returns {Promise<Object>} Replanning result
 */
async function invokeReplanningAgent(userEmail, currentMood = 'okay', force = false) {
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 2000;

    console.log(`[Bedrock] Invoking replanning agent for ${userEmail}, mood: ${currentMood}, force: ${force}`);

    // Create the prompt for the agent
    const prompt = `Replan schedule for user ${userEmail} who is feeling ${currentMood} today.${force ? ' This is a forced replan.' : ''}`;

    // Create valid session ID (no @ or special chars except ._:-)
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '-');

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Use a fresh session ID per attempt so Bedrock doesn't cache the failed session
            const sessionId = `session-${sanitizedEmail}-${Date.now()}`;

            // Prepare the command
            const command = new InvokeAgentCommand({
                agentId: BEDROCK_AGENT_ID,
                agentAliasId: BEDROCK_AGENT_ALIAS_ID,
                sessionId: sessionId,
                inputText: prompt,
                enableTrace: true,
                sessionState: {
                    promptSessionAttributes: {
                        temperature: '0.2',
                        topP: '0.9',
                        topK: '50',
                        maxTokens: '4096'
                    }
                }
            });

            console.log(`[Bedrock] Attempt ${attempt}/${MAX_RETRIES} — session: ${sessionId}`);

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

                        // Detect failure traces early and throw to trigger retry
                        if (event.trace?.trace?.failureTrace) {
                            const failureReason = event.trace.trace.failureTrace.failureReason || 'Unknown failure';
                            throw new Error(`Agent failure trace: ${failureReason}`);
                        }
                    }
                }
            }

            console.log('[Bedrock] Agent response:', fullResponse);

            // The agent should have already called savePlannedTasks
            return {
                redistributed: true,
                message: fullResponse,
                traces: traces
            };

        } catch (error) {
            const isRetryable =
                error.message.includes('timeout') ||
                error.message.includes('Dependency resource') ||
                error.message.includes('ThrottlingException') ||
                error.message.includes('Too many requests') ||
                error.message.includes('Agent failure trace') ||
                error.$metadata?.httpStatusCode === 429 ||
                error.$metadata?.httpStatusCode === 503;

            console.error(`[Bedrock] Attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

            if (error.$metadata) {
                console.error('[Bedrock] Error metadata:', error.$metadata);
            }

            if (isRetryable && attempt < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 2s, 4s, 8s
                console.log(`[Bedrock] Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw new Error(`Bedrock agent invocation failed after ${attempt} attempt(s): ${error.message}`);
            }
        }
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

        const sessionId = `test-session-${Date.now()}`;

        const command = new InvokeAgentCommand({
            agentId: BEDROCK_AGENT_ID,
            agentAliasId: BEDROCK_AGENT_ALIAS_ID,
            sessionId: sessionId,
            inputText: 'Hello, are you working?',
            sessionState: {
                promptSessionAttributes: {
                    temperature: '0.2',
                    topP: '0.9',
                    topK: '50',
                    maxTokens: '4096'
                }
            }
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
