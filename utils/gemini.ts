// FIX: Replaced placeholder content with the full Gemini API utility implementation.

import { GoogleGenAI, Type } from '@google/genai';
import type { FormData, Quote, PackageTier, GeneratedContent, UpsellSuggestion, PackageComparison, FollowUpEmail, ChangeOrder } from '../types';

// Per guidelines, initialize AI with API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

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
        - **cover_letter**: Write a friendly, professional cover letter. Start by thanking the client, briefly mention the project goal from the summary, and express confidence in your company's ability to deliver. Keep it concise (2-3 paragraphs).
        - **scope_of_work**: List the detailed scope of work for the "Better" package. Rephrase from the input scope into a clear, professional list.
        - **inclusions**: List items that are clearly included (e.g., "All specified materials," "Professional labor," "Site cleanup," "Disposal of old materials").
        - **exclusions**: List items typically excluded to prevent scope creep (e.g., "Major structural changes not specified," "Permit fees unless stated," "Repair of pre-existing damage").
        - **schedule_notes**: Elaborate on the timeline target (${formData.timeline}). Mention that it's an estimate and can be affected by factors like unforeseen site conditions or client-requested changes.
        - **payment_schedule**: Create a standard payment schedule. Use the deposit percentage (${formData.deposit}%) as the first milestone. Create 1-2 more logical milestones (e.g., "Upon material delivery," "Upon substantial completion") and a final payment. The percentages must sum to 100.
        - **warranty**: Write a brief paragraph about the ${formData.warranty}-month workmanship warranty.
        - **terms_conditions**: Generate a list of 5-7 standard, generic terms and conditions for a contracting business (e.g., client responsibilities, change orders, liability, payment terms).
        - **acceptance_block**: A short, formal sentence for the signature area. It should state that signing indicates acceptance of the proposal for the selected package's scope and total investment. e.g., "Your signature below indicates acceptance of this proposal, including the scope and total investment for the package selected."

    2.  **upsellSuggestions**: Identify 3 logical, valuable upsells or add-ons based on the project. For each, provide:
        - **name**: A short, catchy name for the upsell (e.g., "Smart Home Upgrade").
        - **why_it_matters**: A brief explanation of the benefit to the client.
        - **line_item**: A sample line item string in the format "description | qty | unit | rate".

    3.  **packageComparison**: Analyze the three packages to help the client make a decision.
        - **differences**: A list of the key differences in scope, materials, or features between the packages.
        - **who_should_choose**: An object with a key for each package tier ('good', 'better', 'best'). For each key, write a short paragraph explaining the ideal customer for that option.
        - **risk_notes**: A list of potential risks or downsides of choosing the "Good" package (e.g., "May not meet future needs," "Uses materials with a shorter lifespan").

    **OUTPUT FORMAT:**
    Return ONLY a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON.
    `;
};

const generatedContentSchema = {
    type: Type.OBJECT,
    properties: {
        cover_letter: { type: Type.STRING },
        scope_of_work: { type: Type.ARRAY, items: { type: Type.STRING } },
        inclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
        exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
        schedule_notes: { type: Type.STRING },
        payment_schedule: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    milestone: { type: Type.STRING },
                    percent: { type: Type.NUMBER },
                },
                required: ['milestone', 'percent'],
            },
        },
        warranty: { type: Type.STRING },
        terms_conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
        acceptance_block: { type: Type.STRING },
    },
    required: [
        'cover_letter', 'scope_of_work', 'inclusions', 'exclusions',
        'schedule_notes', 'payment_schedule', 'warranty', 'terms_conditions',
        'acceptance_block',
    ],
};

export const generateProposalContent = async (
    formData: FormData,
    quotes: { [key in PackageTier]?: Quote },
    selectedTrade: string,
    selectedProject: string
): Promise<{
    generatedContent: GeneratedContent;
    upsellSuggestions: UpsellSuggestion[];
    packageComparison: PackageComparison;
}> => {
    const prompt = buildProposalGenerationPrompt(formData, quotes, selectedTrade, selectedProject);

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            generatedContent: generatedContentSchema,
            upsellSuggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        why_it_matters: { type: Type.STRING },
                        line_item: { type: Type.STRING },
                    },
                    required: ['name', 'why_it_matters', 'line_item'],
                }
            },
            packageComparison: {
                type: Type.OBJECT,
                properties: {
                    differences: { type: Type.ARRAY, items: { type: Type.STRING } },
                    who_should_choose: {
                        type: Type.OBJECT,
                        properties: {
                            good: { type: Type.STRING },
                            better: { type: Type.STRING },
                            best: { type: Type.STRING },
                        },
                        required: ['good', 'better', 'best'],
                    },
                    risk_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['differences', 'who_should_choose', 'risk_notes'],
            }
        },
        required: ['generatedContent', 'upsellSuggestions', 'packageComparison']
    };

    try {
        const result = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2,
            }
        });
        const jsonText = result.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating proposal content:", error);
        throw new Error("Failed to generate proposal content from AI.");
    }
};

const buildFollowUpPrompt = (formData: FormData, quote: Quote, selectedProject: string): string => `
**PROMPT: GENERATE FOLLOW-UP EMAILS**

**ROLE:** You are an automated assistant for ${formData.brand}, a contracting company.
Your task is to write 3 short, professional follow-up email templates related to the proposal you just created.

**PROPOSAL CONTEXT:**
- Project: ${selectedProject} at ${formData.siteAddress}
- Client Type: ${formData.clientType}
- Total Price: ${quote.grandTotal} ${quote.currency}
- Company: ${formData.brand}

**TASK:**
Generate a JSON array of 3 email objects. Each object must have a "subject", a "body", and "send_after_days".

1.  **Email 1: Gentle Reminder**
    - **send_after_days**: 2
    - Subject: "Following up on your proposal for ${selectedProject}"
    - Body: A brief, friendly check-in. Ask if they have any questions and reiterate your excitement for the project.

2.  **Email 2: Value Proposition**
    - **send_after_days**: 5
    - Subject: "Questions about your ${selectedProject} proposal?"
    - Body: Proactively address potential hesitations. Briefly highlight a key value point (e.g., quality of materials, warranty, your company's expertise). Invite them to a quick call.

3.  **Email 3: Final Follow-Up**
    - **send_after_days**: 10
    - Subject: "Your proposal for ${formData.siteAddress} expires soon"
    - Body: A polite final follow-up. Remind them the proposal is valid for ${formData.validity} days. Create a slight sense of urgency without being pushy.

**OUTPUT FORMAT:**
Return ONLY a single, valid JSON array of objects, each with "subject", "body", and "send_after_days".
`;

export const generateFollowUpEmails = async (formData: FormData, quote: Quote, selectedProject: string): Promise<FollowUpEmail[]> => {
    const prompt = buildFollowUpPrompt(formData, quote, selectedProject);

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING },
                send_after_days: { type: Type.NUMBER },
            },
            required: ['subject', 'body', 'send_after_days'],
        },
    };

    try {
        const result = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.5,
            }
        });

        const jsonText = result.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating follow-up emails:", error);
        throw new Error("Failed to generate follow-up emails from AI.");
    }
};

const buildChangeOrderPrompt = (changeRequest: string, formData: FormData, quote: Quote, selectedProject: string): string => `
**PROMPT: GENERATE A CHANGE ORDER**

**ROLE:** You are an expert project manager for ${formData.brand}.
A client has requested a change to an existing proposal. Your task is to process this request and generate a formal change order.

**ORIGINAL PROPOSAL CONTEXT:**
- Project: ${selectedProject}
- Original Grand Total: ${quote.grandTotal} ${quote.currency}
- Original Timeline: ${formData.timeline}

**CLIENT'S CHANGE REQUEST (in plain English):**
"${changeRequest}"

**TASK:**
Analyze the client's request and generate a structured change order. You will need to infer the changes to scope, estimate the price and schedule impacts. Be reasonable in your estimations.

Generate a JSON object with the following structure:

1.  **change_order_summary**: A brief, one-sentence summary of the requested changes.
2.  **added_scope**: A list of specific items/tasks being ADDED to the project.
3.  **removed_scope**: A list of items/tasks being REMOVED. If nothing is removed, return an empty array.
4.  **price_delta**:
    - **items**: A list of line items for the price change, in the format "description | qty | unit | rate". Include both additions (positive rate) and removals (negative rate).
    - **notes**: A brief note explaining the net effect on the price.
5.  **schedule_delta**: A brief statement on how this change will impact the project timeline (e.g., "Adds approximately 1 day to the project timeline.").

**EXAMPLE LOGIC:** If a client wants to "upgrade a standard light switch to a smart dimmer", your \`added_scope\` would be ["Install smart dimmer"], \`removed_scope\` would be ["Install standard switch"], and \`price_delta.items\` might include ["Smart Dimmer | 1 | ea | 80", "Standard Switch | 1 | ea | -10"].

**OUTPUT FORMAT:**
Return ONLY a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON.
`;

export const generateChangeOrder = async (changeRequest: string, formData: FormData, quote: Quote, selectedProject: string): Promise<ChangeOrder> => {
    const prompt = buildChangeOrderPrompt(changeRequest, formData, quote, selectedProject);

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            change_order_summary: { type: Type.STRING },
            added_scope: { type: Type.ARRAY, items: { type: Type.STRING } },
            removed_scope: { type: Type.ARRAY, items: { type: Type.STRING } },
            price_delta: {
                type: Type.OBJECT,
                properties: {
                    items: { type: Type.ARRAY, items: { type: Type.STRING } },
                    notes: { type: Type.STRING },
                },
                required: ['items', 'notes'],
            },
            schedule_delta: { type: Type.STRING },
        },
        required: [
            'change_order_summary', 'added_scope', 'removed_scope',
            'price_delta', 'schedule_delta'
        ],
    };

    try {
        const result = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.3,
            }
        });
        const jsonText = result.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating change order:", error);
        throw new Error("Failed to generate change order from AI.");
    }
};
