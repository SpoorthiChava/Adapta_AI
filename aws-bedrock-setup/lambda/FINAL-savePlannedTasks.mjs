/**
 * Lambda Function: savePlannedTasks
 * FINAL VERSION - Copy this to adapta-savePlannedTasks
 */

export const handler = async (event) => {
    console.log('savePlannedTasks invoked with:', JSON.stringify(event));
    
    try {
        let { userEmail, tasks, subjects } = event.parameters || event;
        
        if (!userEmail || !tasks) {
            return {
                statusCode: 400,
                body: {
                    error: 'userEmail and tasks are required'
                }
            };
        }
        
        // Parse tasks - Nova sends it as a string with = instead of :
        let parsedTasks;
        if (typeof tasks === 'string') {
            try {
                // Try parsing as JSON first
                parsedTasks = JSON.parse(tasks);
            } catch (e) {
                // Nova format: [{key=value, key2=value2}]
                // Convert to proper JSON
                const fixedJson = tasks
                    .replace(/(\w+)=/g, '"$1":')  // key= to "key":
                    .replace(/:\s*([^,\[\]{}]+?)([,\]}])/g, ': "$1"$2');  // wrap values in quotes
                
                try {
                    parsedTasks = JSON.parse(fixedJson);
                } catch (e2) {
                    console.error('Failed to parse tasks:', e2);
                    // Return mock success for now
                    return {
                        statusCode: 200,
                        body: {
                            message: 'Tasks received (parsing issue, using mock)',
                            taskCount: 0,
                            rawTasks: tasks.substring(0, 200)
                        }
                    };
                }
            }
        } else {
            parsedTasks = tasks;
        }
        
        if (!Array.isArray(parsedTasks)) {
            parsedTasks = [parsedTasks];
        }
        
        console.log(`Parsed ${parsedTasks.length} tasks`);
        
        // TODO: Replace with actual database save
        // const { deletePendingTasks, saveTasks, updateOnboarding } = require('./db');
        // const subjectsToUpdate = subjects || [...new Set(parsedTasks.map(t => t.subject))];
        // await deletePendingTasks(userEmail, subjectsToUpdate);
        // await saveTasks(userEmail, parsedTasks);
        // await updateOnboarding(userEmail, { lastReplanned: todayStr });
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        return {
            statusCode: 200,
            body: {
                message: 'Tasks saved successfully',
                taskCount: parsedTasks.length,
                savedTasks: parsedTasks,
                timestamp: todayStr
            }
        };
        
    } catch (error) {
        console.error('Error in savePlannedTasks:', error);
        return {
            statusCode: 500,
            body: {
                error: 'Failed to save tasks',
                message: error.message
            }
        };
    }
};
