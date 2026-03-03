/**
 * Lambda Function: getActiveGoals
 * FINAL VERSION - Copy this to adapta-getActiveGoals
 */

export const handler = async (event) => {
    console.log('getActiveGoals invoked with:', JSON.stringify(event));
    
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
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        // TODO: Replace with actual database calls
        // const { getOnboarding, getTasks, getQuizResults } = require('./db');
        // const onboardingEntries = await getOnboarding(userEmail);
        // const allTasks = await getTasks(userEmail);
        // const quizResults = await getQuizResults(userEmail);
        
        // MOCK DATA - Returns sample active goals
        const activeGoals = [
            {
                id: 'goal_1',
                subject: 'A-Level Mathematics',
                mode: 'exam',
                examDate: '2026-04-15',
                isCrunchMode: false,
                unfinishedTopics: [
                    'Differentiation basics',
                    'Chain rule',
                    'Product rule',
                    'Integration introduction',
                    'Integration by substitution'
                ],
                totalPendingTasks: 5,
                performanceIndex: '45% accuracy',
                recentWeakTopics: ['Chain rule', 'Product rule']
            },
            {
                id: 'goal_2',
                subject: 'A-Level Physics',
                mode: 'exam',
                examDate: '2026-04-20',
                isCrunchMode: false,
                unfinishedTopics: [
                    'Newton\'s Laws',
                    'Forces and motion',
                    'Energy conservation'
                ],
                totalPendingTasks: 3,
                performanceIndex: '78% accuracy',
                recentWeakTopics: []
            }
        ];
        
        return {
            statusCode: 200,
            body: {
                activeGoals: activeGoals,
                todayDate: todayStr
            }
        };
        
    } catch (error) {
        console.error('Error in getActiveGoals:', error);
        return {
            statusCode: 500,
            body: {
                error: 'Failed to fetch active goals',
                message: error.message
            }
        };
    }
};
