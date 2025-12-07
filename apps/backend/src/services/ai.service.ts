import OpenAI from 'openai';

interface GoalContext {
    id: string;
    title: string;
    type: string;
    categories: { id: string; name: string }[];
}

interface ContactContext {
    id: string;
    name: string;
    role: string | null;
}

export interface ExtractedTask {
    description: string;
    assigneeId: string | null;
    priority: 'low' | 'medium' | 'high';
    deadline: string | null; // ISO Date string
}

export class DeepSeekService {
    private client: OpenAI;

    constructor() {
        const apiKey = process.env.DEEPSEEKAUTH;
        if (!apiKey) {
            throw new Error('DEEPSEEKAUTH environment variable is not set');
        }

        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://api.deepseek.com', // Standard DeepSeek API endpoint
        });
    }

    /**
     * Pass 1: Identify the most relevant Goal or Category for the meeting
     */
    async identifyGoal(transcript: string, goals: GoalContext[]): Promise<{ goalId?: string; categoryId?: string } | null> {
        try {
            const systemPrompt = `
You are an intelligent assistant helping to organize meeting notes.
Your task is to analyze the meeting transcript and identify which organizational Goal or Category it best relates to.

Here is the hierarchy of Goals and Categories:
${JSON.stringify(goals, null, 2)}

Return a JSON object with EITHER "goalId" OR "categoryId" (not both, prefer category if specific enough).
If no relevant goal/category is found, return null.
Example: { "categoryId": "123-abc" }
`;

            const response = await this.client.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Meeting Transcript:\n${transcript.substring(0, 8000)}` } // Truncate to avoid context limits if needed
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return null;

            return JSON.parse(content);
        } catch (error) {
            console.error('Error identifying goal:', error);
            return null;
        }
    }

    /**
     * Pass 2: Extract tasks and assign to contacts
     */
    async extractTasks(transcript: string, context: string, contacts: ContactContext[]): Promise<ExtractedTask[]> {
        try {
            const systemPrompt = `
You are an expert project manager.
Your task is to extract actionable tasks from the meeting transcript.
Context: This meeting is related to "${context}".

Here are the available team members (Contacts) you can assign tasks to:
${JSON.stringify(contacts, null, 2)}

Rules:
1. Extract clear, actionable tasks.
2. Assign each task to the most appropriate Contact based on their name or role mentioned in the transcript.
3. If no specific person is clear, leave assigneeId as null.
4. Set priority to 'low', 'medium', or 'high'.
5. Extract any mentioned deadlines or due dates as ISO 8601 strings (YYYY-MM-DD).
   - ONLY set a deadline if a specific date or timeframe (e.g., "by Friday", "next week") is EXPLICITLY mentioned for that specific task.
   - Do NOT infer deadlines from other tasks.
   - Do NOT set a deadline if none is mentioned. Set it to null.
   - Calculate relative dates assuming today is ${new Date().toISOString().split('T')[0]}.

Return a JSON object with a "tasks" array.
Example:
{
  "tasks": [
    { "description": "Email the client", "assigneeId": "123", "priority": "high", "deadline": "2023-12-01" }
  ]
}
`;

            const response = await this.client.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Meeting Transcript:\n${transcript}` }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return [];

            const result = JSON.parse(content);
            return result.tasks || [];
        } catch (error) {
            console.error('Error extracting tasks:', error);
            return [];
        }
    }
}

export const deepSeekService = new DeepSeekService();
