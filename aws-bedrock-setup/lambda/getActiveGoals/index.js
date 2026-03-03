/**
 * Lambda Function: getActiveGoals
 * 
 * Fetches active learning goals (onboarding entries) and calculates
 * context needed for replanning (pending tasks, performance, etc.)
 */

exports.handler = async (event) => {
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
        // const onboardingEntries = await db.getOnboarding(userEmail);
        // const allTasks = await db.getTasks(userEmail);
        // const quizResults = await db.getQuizResults(userEmail);
        
        // MOCK DATA - REPLACE THIS
        const onboardingEntries = [
            {
                id: 'goal_1',
                userEmail: userEmail,
                mode: 'exam',
                onboardingData: {
                    mode: 'exam',
                    level: 'A-Level Mathematics',
                    examDate: '2024-04-15',
                    hoursPerDay: 4
                },
                lastReplanned: '2024-03-19'
            }
        ];
        
        const allTasks = [
            {
                subject: 'A-Level Mathematics',
                subtopic: 'Differentiation basics',
                status: 'pending',
                date: '2024-03-25'
            },
            {
                subject: 'A-Level Mathematics',
                subtopic: 'Chain rule',
                status: 'pending',
                date: '2024-03-26'
            }
        ];
        
        const quizResults = [
            {
                subject: 'A-Level Mathematics',
                score: 2,
                total: 5,
                weakSubtopics: ['Chain rule', 'Product rule']
            }
        ];
        
        // Filter active entries (non-expired exams)
        const activeEntries = onboardingEntries.filter(entry => {
            const plan = entry.onboardingData;
            if (!plan) return false;
            if (plan.mode === 'exam' && plan.examDate) {
                return plan.examDate >= todayStr;
            }
            return true; // Skill mode stays active
        });
        
        // Build context for each goal
        const activeGoals = activeEntries.map(entry => {
            const plan = entry.onboardingData;
            const planSubject = plan.level || plan.skill || 'General';
            
            // Filter tasks for this subject
            const planTasks = allTasks.filter(t => {
                const taskSubject = (t.subject || '').toLowerCase();
                const targetSubject = planSubject.toLowerCase();
                return taskSubject.includes(targetSubject) || targetSubject.includes(taskSubject);
            });
            
            const missedTasks = planTasks.filter(t => 
                t.status === 'pending' && t.date < todayStr
            );
            const pendingTasks = planTasks.filter(t => 
                t.status === 'pending' && t.date >= todayStr
            );
            const unfinishedTopics = [...missedTasks, ...pendingTasks].map(t => t.subtopic);
            
            // Calculate crunch mode
            const examDate = plan.examDate || 'No deadline';
            let isCrunchMode = false;
            if (plan.mode === 'exam' && examDate !== 'No deadline') {
                const diffDays = Math.ceil(
                    (new Date(examDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24)
                );
                isCrunchMode = diffDays <= 3;
            }
            
            // Calculate performance
            const relevantQuizzes = quizResults.filter(q => {
                const subject = (q.subject || '').toLowerCase();
                const target = planSubject.toLowerCase();
                return subject.includes(target) || target.includes(subject);
            }).slice(0, 5);
            
            const avgScore = relevantQuizzes.length > 0
                ? (relevantQuizzes.reduce((acc, q) => acc + (q.score / q.total), 0) / relevantQuizzes.length) * 100
                : null;
            
            return {
                id: entry.id,
                subject: planSubject,
                mode: plan.mode,
                examDate: examDate,
                isCrunchMode: isCrunchMode,
                unfinishedTopics: unfinishedTopics,
                totalPendingTasks: unfinishedTopics.length,
                performanceIndex: avgScore ? `${avgScore.toFixed(0)}% accuracy` : 'No data yet',
                recentWeakTopics: [...new Set(relevantQuizzes.flatMap(q => q.weakSubtopics || []))]
            };
        });
        
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
