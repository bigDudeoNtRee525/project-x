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
    title: string;
    description: string;
    assigneeId: string | null;
    assigneeName: string | null;
    priority: 'low' | 'medium' | 'high';
    deadline: string | null; // ISO Date string
    sourceExcerpts?: string[];
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
        const today = new Date().toISOString().split('T')[0];

        try {
            const systemPrompt = `You are an expert project manager and meeting scribe who specializes in turning meeting discussions into clear, structured action items that are ready to go into a task tracker.

Context: This meeting is related to "${context}"

Here are the available team members (Contacts) you can assign tasks to:
${JSON.stringify(contacts, null, 2)}

Your job:
Given a meeting transcript, extract all concrete, actionable follow-up tasks and return them in a structured JSON format.

OUTPUT FORMAT (JSON ONLY):
Return a JSON object with this exact shape:

{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "assigneeId": "string|null",
      "assigneeName": "string|null",
      "priority": "low" | "medium" | "high",
      "deadline": "YYYY-MM-DD|null",
      "sourceExcerpts": [ "string" ]
    }
  ]
}

Do not include any text outside of this JSON. Do not include explanations.

--------------------
TASK IDENTIFICATION RULES
--------------------
1. Extract clear, actionable follow-up work only.
   - Create a task when:
     - Someone is asked to do something.
     - Someone volunteers to do something.
     - The group agrees that something should be done.
   - Examples: "send the updated deck", "schedule a follow-up meeting", "update the spec", "analyze last week's metrics".

2. Do NOT create tasks for:
   - General discussion or brainstorming without a clear owner.
   - Work that is already completed.
   - Vague intentions like "we should think about…" with no concrete next step.
   - Pure decisions (e.g., "We'll use Option B") unless there is explicit follow-up work attached.

3. Granularity:
   - Merge obvious duplicates into a single task.
   - If one discussion clearly assigns different parts to different people, split into separate tasks per person.
   - Don't invent extra subtasks that were not discussed.

--------------------
ASSIGNEE RULES
--------------------
4. Use the Contacts list to assign tasks:
   - Match people mentioned in the transcript to Contacts by:
     - Exact or close name match (first name, last name, or full name).
     - Role/title if it clearly maps to a Contact's role.
   - When you have a confident match:
     - Set assigneeId to that contact's id.
     - Set assigneeName to that contact's name from Contacts.

5. If a person is mentioned but is NOT in Contacts:
   - Set assigneeId to null.
   - Set assigneeName to the name or role as spoken in the transcript (e.g., "Alex (vendor)", "data science team").

6. If no specific person or role is clearly responsible:
   - Set assigneeId to null.
   - Set assigneeName to null.

7. Never guess or fabricate an assignee.
   - If you are not confident about the mapping to a Contact, leave assigneeId as null.

--------------------
PRIORITY RULES
--------------------
8. Use the following guidance for priority:
   - high:
     - Explicit urgency cues: "urgent", "ASAP", "as soon as possible", "critical", "blocker", "top priority", "must be done".
     - Tasks that clearly unblock many other tasks and are framed as urgent.
   - low:
     - "nice to have", "if there's time", "later", "not urgent", "eventually".
   - medium:
     - Default when no clear urgency signal is given.

9. Do not invent urgency beyond what is implied.
   - If the transcript is neutral, use "medium".

--------------------
DEADLINE RULES
--------------------
10. Only set a deadline if a specific date or timeframe is explicitly mentioned for that particular task.

11. Accepted deadline references:
    - Explicit dates: "on March 10", "by 2025-03-10".
    - Relative dates tied to now: "by Friday", "next week", "end of this month", "tomorrow".
    - Use today = ${today} to convert relative dates into ISO 8601 (YYYY-MM-DD).

12. Important constraints:
    - ONLY set a deadline if it is clearly tied to that specific task.
    - Do NOT infer a deadline for one task based on another task's deadline.
    - Do NOT treat vague expressions like "soon", "later", "in the future", "at some point" as deadlines.
    - If no clear date or timeframe is mentioned for that task, set deadline to null.

--------------------
QUALITY & OUTPUT RULES
--------------------
13. Titles (CRITICAL - KEEP THEM SHORT):
    - MAXIMUM 5-8 words. Be concise and precise.
    - Start with an action verb (Send, Create, Review, Update, Schedule, etc.)
    - NO filler words like "Need to", "Should", "We have to", "Make sure to"
    - Good examples: "Send roadmap to client", "Review Q4 metrics", "Schedule design review"
    - BAD examples: "We need to send the revised roadmap document to the client for their review" (too long!)
    - If you can say it in fewer words, do it.

14. Descriptions:
    - Include key details: what needs to be done, any specific requirements, and any relevant context from the meeting.
    - Keep concise; 1–3 sentences is usually enough.
    - Can be empty string if nothing extra beyond the title.

15. SourceExcerpts:
    - Include short quotes or paraphrases from the transcript to justify why this task exists.
    - Can be empty array if not needed.

16. Output:
    - Return ONLY the JSON object described above, with valid JSON syntax.
    - Do NOT include explanations, markdown, or any text before or after the JSON.`;

            const response = await this.client.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Now, analyze the following meeting transcript and produce the JSON tasks object:\n\n<<<TRANSCRIPT>>>\n${transcript}\n<<<END TRANSCRIPT>>>` }
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
