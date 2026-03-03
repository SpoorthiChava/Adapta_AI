/**
 * Lambda Function: getUserContext
 * FINAL VERSION - Copy this to adapta-getUserContext
 */

export const handler = async (event) => {
    console.log('getUserContext invoked with:', JSON.stringify(event));
    
    try {
        const { userEmail } = event.parameters || event;
        
        if (!userEmail) {
            return {
                statusCode: 400,
                body: {
                    error: 'userEmail is required'
                }
            };
        }
        
        // TODO: Replace with actual database calls
        // const { getUserByEmail, getTasks, getQuizResults } = require('./db');
        // const user = await getUserByEmail(userEmail);
        // const tasks = await getTasks(userEmail);
        // const quizResults = await getQuizResults(userEmail);
        
        // MOCK DATA for testing
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
                date: '2026-03-25'
            }
        ];
        
        const quizResults = [
            {
                subject: 'Mathematics',
                topic: 'Calculus',
                score: 3,
                total: 5,
                weakSubtopics: ['Chain rule'],
                date: '2026-03-20'
            }
        ];
        
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
                quizResults: quizResults.slice(0, 10),
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
