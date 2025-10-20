import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import type { FormData, Quote, PackageTier, ChangeOrder, FollowUpEmail, GeneratedContent, PackageComparison, UpsellSuggestion } from '../types';

const model = 'gemini-2.5-flash';

// --- PROMPT BUILDERS (MOVED FROM FRONTEND) ---

const buildProposalGenerationPrompt = (
    formData: FormData,
    quotes: { [key in PackageTier]?: Quote },
    selectedTrade: string,
    selectedProject: string
): string => {
    const goodQuote = quotes.good ? JSON.stringify(quotes.good, null, 2) : 'Not provided';
    const betterQuote = quotes.better ? JSON.stringify(quotes.better, null, 2) : 'Not provided';
    const bestQuote = quotes.best ? JSON.stringify(quotes.best, null, 2) : 'Not provided';

    return `
    **PROMPT: GENERATE COMPREHENSIVE PROPOSAL CONTENT**
    **ROLE:** You are an expert proposal writer for a ${formData.brand}, a contracting company specializing in ${selectedTrade}.
    Your client is a ${formData.clientType}.
    Your task is to generate a complete, professional, and persuasive proposal based on the following job data.
    **YOUR COMPANY DETAILS:**
    - Company Name: ${formData.brand}
    - License #: ${formData.license}
    - Currency: ${formData.currency}
    - Warranty: ${formData.warranty} months
    - Proposal Validity: ${formData.validity} days
    **JOB DETAILS:**
    - Project Title: ${selectedProject}
    - Site Address: ${formData.siteAddress}
    - Job Summary: ${formData.summary}
    - Constraints: ${formData.constraints}
    - Timeline Target: ${formData.timeline}
    **PACKAGE & PRICING DETAILS:**
    You are provided with three package options. Analyze their scope, materials, and pricing to inform your writing.
    *GOOD PACKAGE:*
    - Scope: ${formData.packages.good.scope}
    - Quote Details: ${goodQuote}
    *BETTER PACKAGE (PRIMARY):*
    - Scope: ${formData.packages.better.scope}
    - Quote Details: ${betterQuote}
    *BEST PACKAGE:*
    - Scope: ${formData.packages.best.scope}
    - Quote Details: ${bestQuote}
    **GENERATION TASKS:**
    Based on all the information provided, generate a single JSON object with the following three top-level keys: "generatedContent", "upsellSuggestions", and "packageComparison".
    1.  **generatedContent**: Write all customer-facing proposal text, focusing on the "Better" package as the primary option.
    2.  **upsellSuggestions**: Identify 3 logical, valuable upsells or add-ons based on the project.
    3.  **packageComparison**: Analyze the three packages to help the client make a decision.
    **OUTPUT FORMAT:**
    Return ONLY a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON.
    `;
};

const buildFollowUpPrompt = (formData: FormData, quote: Quote, selectedProject: string): string => `
**PROMPT: GENERATE FOLLOW-UP EMAILS**
**ROLE:** You are an automated assistant for ${formData.brand}.
**TASK:**
Generate a JSON array of 3 email objects. Each object must have a "subject", a "body", and "send_after_days".
**PROPOSAL CONTEXT:**
- Project: ${selectedProject} at ${formData.siteAddress}
- Total Price: ${quote.grandTotal} ${quote.currency}
**EMAILS TO GENERATE:**
1.  **Email 1 (Day 2):** Gentle Reminder.
2.  **Email 2 (Day 5):** Value Proposition.
3.  **Email 3 (Day 10):** Final Follow-Up (mentioning validity of ${formData.validity} days).
**OUTPUT FORMAT:**
Return ONLY a single, valid JSON array of objects.
`;

const buildChangeOrderPrompt = (changeRequest: string, formData: FormData, quote: Quote, selectedProject: string): string => `
**PROMPT: GENERATE A CHANGE ORDER**
**ROLE:** You are an expert project manager for ${formData.brand}.
**ORIGINAL PROPOSAL CONTEXT:**
- Project: ${selectedProject}
- Original Grand Total: ${quote.grandTotal} ${quote.currency}
**CLIENT'S CHANGE REQUEST:** "${changeRequest}"
**TASK:**
Analyze the client's request and generate a structured change order JSON object including: "change_order_summary", "added_scope", "removed_scope", "price_delta" (with items and notes), and "schedule_delta".
**OUTPUT FORMAT:**
Return ONLY a single, valid JSON object.
`;


// --- API HANDLER ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        return res.status(500).json({ error: "Server configuration error: API key is missing." });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const { generationType, payload } = req.body;

        let prompt;
        let schema;
        let temperature = 0.3;

        switch (generationType) {
            case 'proposal':
                prompt = buildProposalGenerationPrompt(payload.formData, payload.quotes, payload.selectedTrade, payload.selectedProject);
                schema = { /* Schema for proposal */
                    type: Type.OBJECT,
                    properties: {
                        generatedContent: { type: Type.OBJECT, properties: { cover_letter: { type: Type.STRING }, scope_of_work: { type: Type.ARRAY, items: { type: Type.STRING } }, inclusions: { type: Type.ARRAY, items: { type: Type.STRING } }, exclusions: { type: Type.ARRAY, items: { type: Type.STRING } }, schedule_notes: { type: Type.STRING }, payment_schedule: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { milestone: { type: Type.STRING }, percent: { type: Type.NUMBER } } } }, warranty: { type: Type.STRING }, terms_conditions: { type: Type.ARRAY, items: { type: Type.STRING } }, acceptance_block: { type: Type.STRING } } },
                        upsellSuggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, why_it_matters: { type: Type.STRING }, line_item: { type: Type.STRING } } } },
                        packageComparison: { type: Type.OBJECT, properties: { differences: { type: Type.ARRAY, items: { type: Type.STRING } }, who_should_choose: { type: Type.OBJECT, properties: { good: { type: Type.STRING }, better: { type: Type.STRING }, best: { type: Type.STRING } } }, risk_notes: { type: Type.ARRAY, items: { type: Type.STRING } } } }
                    }
                };
                break;
            case 'followups':
                prompt = buildFollowUpPrompt(payload.formData, payload.quote, payload.selectedProject);
                schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, body: { type: Type.STRING }, send_after_days: { type: Type.NUMBER } } } };
                temperature = 0.5;
                break;
            case 'changeorder':
                prompt = buildChangeOrderPrompt(payload.changeRequest, payload.formData, payload.quote, payload.selectedProject);
                schema = { type: Type.OBJECT, properties: { change_order_summary: { type: Type.STRING }, added_scope: { type: Type.ARRAY, items: { type: Type.STRING } }, removed_scope: { type: Type.ARRAY, items: { type: Type.STRING } }, price_delta: { type: Type.OBJECT, properties: { items: { type: Type.ARRAY, items: { type: Type.STRING } }, notes: { type: Type.STRING } } }, schedule_delta: { type: Type.STRING } } };
                break;
            default:
                return res.status(400).json({ error: 'Invalid generation type.' });
        }

        const result = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: temperature,
            }
        });

        const jsonText = result.text.trim();
        const data = JSON.parse(jsonText);

        return res.status(200).json(data);

    } catch (error) {
        console.error('Error in API route:', error);
        const message = error instanceof Error ? error.message : "An unknown error occurred on the server.";
        return res.status(500).json({ error: message });
    }
}
