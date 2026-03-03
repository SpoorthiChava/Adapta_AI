/**
 * Updated Planning Engine using AWS Bedrock Agent
 * 
 * This is a modified version of your planningEngine.js that uses
 * Bedrock instead of Gemini for replanning.
 */

const { getTasks, getUserByEmail, getOnboarding, updateOnboarding } = require('../db');
const { invokeReplanningAgent } = require('./bedrockUtils');

class PlanningEngine {

    /**
     * Re-plans all future/missed tasks using AWS Bedrock Agent.
     * Considers: Today's date, Exam date, Current mood, Performance status, and Daily hours.
     * Strict Rules: Runs only once per day per plan to maintain stability (unless force=true).
     */
    static async ensureOptimalPlan(userEmail, currentMood = 'okay', force = false) {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const user = await getUserByEmail(userEmail);
            const onboardingEntries = await getOnboarding(userEmail);

            if (!onboardingEntries || onboardingEntries.length === 0) {
                return { redistributed: false };
            }

            // Filter out inactive plans (expired exams)
            const activeEntries = onboardingEntries.filter(entry => {
                const plan = entry.onboardingData;
                if (!plan) return false;
                if (plan.mode === 'exam' && plan.examDate) {
                    return plan.examDate >= todayStr;
                }
                return true;
            });

            if (activeEntries.length === 0) {
                console.log(`[PlanningEngine] No active plans for ${userEmail}. Skipping replan.`);
                return { redistributed: false };
            }

            // Check if ANY active plan needs replanning today
            const triggeringEntry = activeEntries.find(entry => entry.lastReplanned !== todayStr);
            const needsReplan = !!triggeringEntry || force;

            if (!needsReplan) {
                console.log(`[PlanningEngine] All plans current for ${userEmail}. Skipping replan.`);
                return { redistributed: false };
            }

            if (force) {
                console.log(`[PlanningEngine] FORCE replan triggered for ${userEmail}`);
            } else {
                console.log(`[PlanningEngine] Replan triggered for ${userEmail} by entry: ${triggeringEntry.id}`);
            }

            console.log(`[PlanningEngine] Invoking Bedrock agent for ${userEmail}. Mood: ${currentMood}`);

            // BEDROCK INTEGRATION: Replace Gemini call with Bedrock agent invocation
            const result = await invokeReplanningAgent(userEmail, currentMood, force);

            // The Bedrock agent handles:
            // 1. Fetching user context via getUserContext Lambda
            // 2. Fetching active goals via getActiveGoals Lambda
            // 3. Generating new task schedule
            // 4. Saving tasks via savePlannedTasks Lambda
            // 5. Updating lastReplanned timestamp

            // So we just need to verify it worked and return
            if (result.redistributed) {
                console.log(`[PlanningEngine] Bedrock agent completed replanning for ${userEmail}`);
                
                // Fetch updated tasks to return count
                const updatedTasks = await getTasks(userEmail);
                const pendingCount = updatedTasks.filter(t => t.status === 'pending').length;
                
                return {
                    redistributed: true,
                    count: pendingCount,
                    message: result.message
                };
            } else {
                console.warn(`[PlanningEngine] Bedrock agent did not complete replanning`);
                return { redistributed: false };
            }

        } catch (error) {
            console.error('[PlanningEngine] ensureOptimalPlan error:', error);
            
            // CRITICAL: Mark as replanned anyway to prevent infinite loops
            const todayStr = new Date().toISOString().split('T')[0];
            const onboardingEntries = await getOnboarding(userEmail);
            const activeEntries = onboardingEntries.filter(entry => {
                const plan = entry.onboardingData;
                if (!plan) return false;
                if (plan.mode === 'exam' && plan.examDate) {
                    return plan.examDate >= todayStr;
                }
                return true;
            });
            
            for (const entry of activeEntries) {
                await updateOnboarding(entry.id, userEmail, { lastReplanned: todayStr });
            }
            
            return { error: error.message, redistributed: false };
        }
    }

    /**
     * Adjustment for mood - triggers a replan pass.
     */
    static async adjustTasksForMood(userEmail, mood) {
        return this.ensureOptimalPlan(userEmail, mood);
    }

    /**
     * Marks a topic as weak and enforces a replan.
     */
    static async markTopicAsWeak(userEmail, topicName) {
        console.log(`[PlanningEngine] Marking ${topicName} as weak for ${userEmail}`);
        return this.ensureOptimalPlan(userEmail);
    }

    /**
     * Spaced Repetition logic remains programmatic (1-4-7 rule)
     * This is applied during initial plan generation, not replanning
     */
    static async applySpacedRepetition(tasks, examDate) {
        const today = new Date();
        const exam = new Date(examDate);
        const diffDays = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 14) return tasks;

        const extraTasks = [];
        const learningTasks = tasks.filter(t => t.sessionType.includes('Learning'));

        for (const task of learningTasks) {
            const day4Date = new Date(task.date);
            day4Date.setDate(day4Date.getDate() + 3);
            const day7Date = new Date(task.date);
            day7Date.setDate(day7Date.getDate() + 6);

            if (day4Date < exam) {
                extraTasks.push({
                    ...task,
                    id: `rev3_${task.id}_${Math.random().toString(36).substring(2, 7)}`,
                    date: day4Date.toISOString().split('T')[0],
                    sessionType: 'Reinforcement Revision',
                    aiExplanation: `Spaced repetition: Reviewing ${task.subtopic} to solidify memory.`
                });
            }

            if (day7Date < exam) {
                extraTasks.push({
                    ...task,
                    id: `rev6_${task.id}_${Math.random().toString(36).substring(2, 7)}`,
                    date: day7Date.toISOString().split('T')[0],
                    sessionType: 'Deep Revision',
                    aiExplanation: `Second recall: Strengthening ${task.subtopic}.`
                });
            }
        }

        return [...tasks, ...extraTasks];
    }
}

module.exports = PlanningEngine;
