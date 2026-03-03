require('dotenv').config();
const { testBedrockConnection, invokeReplanningAgent } = require('./bedrockUtils');

async function test() {
    console.log('=== Testing Bedrock Integration ===\n');
    
    console.log('1. Testing connection...');
    const connected = await testBedrockConnection();
    
    if (connected) {
        console.log('✅ Connection successful!\n');
        
        console.log('2. Testing replanning...');
        try {
            const result = await invokeReplanningAgent('test@example.com', 'tired', false);
            console.log('✅ Replanning test result:', result);
        } catch (error) {
            console.error('❌ Replanning test failed:', error.message);
        }
    } else {
        console.error('❌ Connection failed. Check your credentials and agent ID.');
    }
}

test().catch(console.error);
