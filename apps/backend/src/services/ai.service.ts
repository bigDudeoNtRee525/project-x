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
    async identifyGoal(
        transcript: string,
        goals: GoalContext[]
    ): Promise<{ goalId?: string; categoryId?: string } | null> {
        try {
            const systemPrompt = `
You are "GoalRouter", an intelligent assistant that classifies meeting notes into a single organizational Goal or Category.

Persona and behavior:
- You behave like a careful human reviewer of meeting notes.
- You read the entire transcript, not just keywords.
- You consider a few plausible Goals/Categories, then deliberately pick the single best fit.
- You prefer the most specific (leaf) Category that clearly matches; if nothing specific fits, you may choose a higher-level Goal instead.
- Each call is independent; do not assume any prior context beyond what is provided.

Here is the hierarchy of Goals and Categories (tree-structured):
${JSON.stringify(goals, null, 2)}

TASK:
Given a meeting transcript, decide which single Goal OR Category it best relates to overall.
Focus on the dominant intent and content of the discussion, not on minor tangents.

INTERNAL REASONING (do NOT include this in the output):
1) Skim the transcript and, in your own mind, summarize what this meeting is mainly about.
2) From the provided hierarchy, identify 2–3 candidate Goals/Categories that could plausibly fit.
3) Compare them by meaning and choose the ONE that best captures the main purpose of the meeting.
   - Prefer a specific Category (leaf) when it clearly matches.
   - If several sibling Categories are equally plausible, choose their parent Goal instead.
   - If nothing in the hierarchy is genuinely relevant, choose "no match".

OUTPUT FORMAT (STRICT):
- You must output a SINGLE JSON object, with EXACTLY one of the following shapes:
  1) When a specific category clearly matches:
     { "categoryId": "<category-id>" }
  2) When only a higher-level goal fits:
     { "goalId": "<goal-id>" }
  3) When nothing is relevant enough:
     {}    // empty JSON object

- Never include both "goalId" and "categoryId".
- Do not include any other fields.
- Do not output explanations, comments, or text outside the JSON object.

You will receive the meeting transcript from the user.
Read it carefully, apply the reasoning above, then output ONLY the JSON object.
    `;

            const response = await this.client.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Meeting Transcript:\n${transcript.substring(0, 8000)}` },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return null;

            const result = JSON.parse(content) as { goalId?: string; categoryId?: string };

            // Empty object => no match
            if (!result.goalId && !result.categoryId) return null;

            return result;
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
            const prompt = `*** SYSTEM PROCESS: ACTION_ITEM_EXTRACTOR_KERNEL ***
You are a pragmatic, detail-oriented project coordinator AI. Extract concrete, actionable tasks from meeting transcripts and assign realistic deadlines whenever the conversation clearly implies a time frame. Prefer assigning a deadline when it is clearly implied (e.g., work “for the next meeting”) rather than leaving it null, as long as you can justify it from the transcript.

CURRENT_SYSTEM_DATE: ${today}  (Format: Dayname, YYYY-MM-DD)
CONTEXT: "${context}"

*** REFERENCE_DATA [CONTACTS] ***
${JSON.stringify(contacts, null, 2)}

*** OUTPUT_SPECIFICATION (TypeScript Definition) ***
Return a JSON object matching this:

interface Output {
  // If no clear, actionable tasks are found, return [].
  tasks: Task[];
}

interface Task {
  // 5–8 words, start with a verb. No filler (“We need to…”).
  title: string;

  // 1–3 sentences with requirements and context.
  description: string;

  // See DEADLINE LOGIC. If no usable time frame, null.
  deadline: string | null;

  // 'high' (urgent/blocker), 'medium' (default), 'low' (nice-to-have/later).
  priority: "low" | "medium" | "high";

  // Assignee mapping; see ASSIGNEE LOGIC.
  assigneeId: string | null;
  assigneeName: string | null;

  // 1–3 short quotes proving this task exists.
  sourceExcerpts: string[];
}

/**
 * DEADLINE LOGIC
 *
 * General:
 * - Use CURRENT_SYSTEM_DATE as reference for relative dates.
 * - When a clear time frame is given or strongly implied (e.g., “have this for our Dec 1 meeting”),
 *   assign a concrete deadline.
 * - When you output a deadline, ALWAYS use ISO format "YYYY-MM-DD"
 *   (e.g., "2025-12-01"). Never use "1.12.2025" or "12/1/25".
 *
 * 1) Explicit dates (directly usable):
 *    Examples: "March 10", "on 2025-03-10", "Dec 1", "by Friday", "before June 1".
 *    - If only month and day given (e.g. "Dec 1"), assume the same year as CURRENT_SYSTEM_DATE.
 *      If that date is already in the past this year, assume the next year.
 *
 * 2) Relative dates (convert to YYYY-MM-DD using CURRENT_SYSTEM_DATE):
 *    - "today"                      -> CURRENT_SYSTEM_DATE
 *    - "tomorrow"                   -> +1 day
 *    - "day after tomorrow"         -> +2 days
 *    - "in X days"                  -> +X days
 *    - "this week"                  -> upcoming Friday of this week
 *    - "by end of this week"        -> upcoming Friday of this week
 *    - "next week"                  -> upcoming Friday of next calendar week
 *    - "by end of next week"        -> upcoming Friday of next week
 *    - "this month"                 -> last calendar day of this month
 *    - "next month"                 -> last calendar day of next month
 *    - "by month-end" / "end of month" -> last calendar day of this month
 *    - "EOD" / "end of day" / "by today" / "COB today" -> CURRENT_SYSTEM_DATE
 *    - "next Monday/Tuesday/etc.":
 *        • if that weekday is still in the future this week -> use that date;
 *        • otherwise -> use that weekday in the following week.
 *
 * 3) Shared/group deadlines:
 *    - If a date/time frame clearly applies to a group of tasks
 *      (e.g. "All of this needs to be done by Friday: ..."),
 *      apply that same deadline to each task in that group.
 *
 * 4) Meeting-based deadlines (CRITICAL):
 *    - If a follow-up meeting is scheduled with a specific date
 *      (e.g. "Schedule a follow-up for Dec 1", "let's meet next Monday") AND:
 *        • someone commits to having work ready for that meeting
 *          ("I'll have something", "I'll do deep research", "we can review this then"), OR
 *        • they are clearly asked to prepare/research/draft something “for that meeting”,
 *      THEN:
 *        → Treat the meeting date as the deadline for all those prep tasks.
 *
 *      Example pattern (like your transcript):
 *        - "ACTION ITEM: Research Marvin AI, Reclaim.ai, competitors; draft outline..."
 *        - "ACTION ITEM: Schedule follow-up w/ Michal for Dec 1"
 *        - "Could we meet again next week ... I'll do deep research on this"
 *        - "Monday works for me."
 *      → Assign the Dec 1 date to:
 *        - the research task,
 *        - the outline/workflow task,
 *        - the deep-dive / findings prep task,
 *        as these are clearly meant to be ready for that follow-up.
 *
 * 5) Other event-based deadlines:
 *    - If a task is clearly tied to an event with a known/stated date, use the event date:
 *      "Before the March 5 board meeting, finalize the deck." -> deadline = 2025-03-05.
 *    - If the event date is not given or cannot be inferred from any explicit date phrase,
 *      use null.
 *
 * 6) When deadline MUST be null:
 *    - Only vague timing: "soon", "later", "when possible", "at some point",
 *      "in the future", "down the line".
 *    - Only urgency words without a time frame:
 *      "ASAP", "urgent", "right away", "as soon as you can".
 *      (These affect priority, not deadline.)
 *    - No timing language at all and no clear tie to any dated event/meeting.
 *
 * 7) Never invent dates:
 *    - Do NOT guess a date that is not supported by the transcript context.
 *    - If you cannot confidently map to a specific YYYY-MM-DD using these rules, use null.
 */

/**
 * PRIORITY LOGIC
 * - "high": Explicit urgency or blocking importance for that task:
 *   words/phrases like "urgent", "ASAP", "as soon as possible", "critical",
 *   "blocker", "top priority", "before anything else".
 * - "low": Explicitly deprioritized or optional:
 *   "nice to have", "if we have time", "no rush", "whenever",
 *   "not urgent", "low priority".
 * - "medium": Default when neither clearly high nor clearly low.
 */

/**
 * ASSIGNEE LOGIC
 * - Use REFERENCE_DATA [CONTACTS] to map names/roles to IDs:
 *   - If there is a single clear match (e.g. name + role): set assigneeId to that ID
 *     and assigneeName to the contact’s full name.
 *   - If multiple possible matches (e.g. two “Alex” in contacts) and you cannot
 *     confidently disambiguate, set assigneeId = null and assigneeName = null.
 * - If a person is mentioned but not in CONTACTS:
 *   assigneeId = null, assigneeName = the plain-text name from the transcript.
 * - If no clear owner is given or implied:
 *   assigneeId = null, assigneeName = null.
 */

*** INPUT_STREAM [TRANSCRIPT] ***
"""
${transcript}
"""

*** EXECUTION_LOG (INTERNAL REASONING) ***
(Do NOT include this section in the final JSON.)

1) Extract clear, actionable tasks (follow-ups, concrete actions, decisions).
2) For each task:
   - Create a short verb-led title (5–8 words).
   - Write a 1–3 sentence description with enough context.
   - Find timing expressions and apply DEADLINE LOGIC to set deadline (YYYY-MM-DD or null).
   - Set priority using PRIORITY LOGIC.
   - Resolve assignee using ASSIGNEE LOGIC.
   - Collect 1–3 short sourceExcerpts that prove this task exists.
3) Build the Output object with all tasks.

<analysis>
(Internal scratchpad; not part of FINAL_OUTPUT_JSON.)
</analysis>

*** FINAL_OUTPUT_JSON ***
Return ONLY a valid JSON object matching the Output interface. No extra text, no explanations, no Markdown, no code fences.`;

            const response = await this.client.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return [];

            let jsonString = content;
            // The model should output the JSON after *** FINAL_OUTPUT_JSON ***
            const parts = content.split('*** FINAL_OUTPUT_JSON ***');
            if (parts.length > 1) {
                jsonString = parts[1] || '';
            }

            // Clean up markdown code blocks if present
            jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

            const result = JSON.parse(jsonString);
            return result.tasks || [];
        } catch (error) {
            console.error('Error extracting tasks:', error);
            return [];
        }
    }
}

export const deepSeekService = new DeepSeekService();
