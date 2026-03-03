/**
 * Lambda Function: getUserContext
 * 
 * Fetches user profile, tasks, and quiz results from your database.
 * This provides context to the Bedrock agent for replanning.
 */

// TODO: Replace with your actual database client
// Example shown uses a hypothetical DB module
// const db = require('./db'); // Your database module

exports.handler = async (event) => {
    console.log('getUserContext invoked with:', JSON.stringify(event));
    
    try {
        // Extract parameters from Bedrock agent
        const { userEmail } = event.parameters || event;
        
        if (!userEmail) {
            return {
                statusCode: 400,
                body: {
                    error: 'userEmail is required'
                }
            };
        }
        
        // TODO: Replace these with actual database calls
        // Example structure - adapt to your database:
        
        // const user = await db.getUserByEmail(userEmail);
        // const tasks = await db.getTasks(userEmail);
        // const quizResults = await db.getQuizResults(userEmail);
        
        // MOCK DATA for testing - REPLACE THIS
        const user = {
            email: userEmail,
            name: 'Test User',
            dailyHours: 4,
            currentStreak: 7,
            currentMood: 'okay',
            lastMoodDate: new Date().toISOString().split('T')[0]
        };
        
        const tasks = [
            {
                id: 'task1',
                subject: 'Mathematics',
                topic: 'Calculus',
                subtopic: 'Differentiation',
                status: 'pending',
                date: '2024-03-25'
            }
        ];
        
        const quizResults = [
            {
                subject: 'Mathematics',
                topic: 'Calculus',
                score: 3,
                total: 5,
                weakSubtopics: ['Chain rule'],
                date: '2024-03-20'
            }
        ];
        
        // Return context for the agent
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
                quizResults: quizResults.slice(0, 10), // Last 10 quizzes
                todayDate: new Date().toISOString().split('T')[0]
            }
        };
        
    } catch (error) {
        console.error('Error in getUserContext:', error);
        return {
            statusCode: 500,
            body: {
                error: 'Failed to fetch user context',
                message: error.message
            }
        };
    }
};
