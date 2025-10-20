import { GoogleGenAI, Type } from '@google/genai';
import type { FormData, Quote, GeneratedContent, UpsellSuggestion, PackageComparison, FollowUpEmail, ChangeOrder, PackageTier } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- PROMPT BUILDERS ---

const buildOptimizedPrompt = (
    task: string,
    payload: any
) => {
    const { formData, quotes, selectedTrade, selectedProject } = payload;
    const betterQuote = quotes.better ? JSON.stringify({
        totalMaterialCost: quotes.better.totalMaterialCost,
        totalLaborCost: quotes.better.totalLaborCost,
        grandTotal: quotes.better.grandTotal,
        depositDue: quotes.better.depositDue,
    }, null, 2) : 'Not provided';

    const baseContext = `
    **ROLE:** You are an expert proposal writer for ${formData.brand}, a contracting company specializing in ${selectedTrade}.
    **CLIENT:** ${formData.clientType}.
    **PROJECT:** "${selectedProject}" - ${formData.summary}.
    **COMPANY INFO:** Warranty: ${formData.warranty} months, Validity: ${formData.validity} days.
    **FINANCIALS:** Currency: ${formData.currency}, "Better" Package Price: ~${betterQuote}.
    **OUTPUT FORMAT:** You MUST return ONLY a single, valid JSON object that strictly adheres to the provided schema. Do not include any other text, markdown, or explanations.
    `;

    switch (task) {
        case 'proposalContent':
            return `${baseContext}
            **TASK:** Generate all sections for a complete proposal document. Be professional, clear, and persuasive.
            - Cover Letter: A friendly, professional introduction.
            - Scope of Work: Based on this scope: "${formData.packages.better.scope}".
            - Inclusions/Exclusions: General items for this type of project.
            - Schedule Notes: Based on this timeline: "${formData.timeline}" and constraints: "${formData.constraints}".
            - Risk Assessment: 2 specific, relevant risks and their mitigation strategies.
            - Payment Schedule: A standard schedule based on a ${formData.deposit}% deposit.
            - Warranty: A detailed warranty statement based on the ${formData.warranty}-month term.
            - Terms & Conditions: 5-7 standard, concise terms.
            - Acceptance Block: A standard legal acceptance statement.`;
        
        case 'upsells':
            return `${baseContext}
            **TASK:** Identify 3 logical, valuable upsell opportunities related to the project. For each, provide a compelling "why_it_matters" and a "line_item" string formatted as 'Description | Qty | Unit | Rate'.`;

        case 'comparison':
             return `
            **ROLE:** You are an expert sales analyst for a trade contractor.
            **PROJECT:** "${selectedProject}"
            **PACKAGE SCOPES:**
            - Good: ${formData.packages.good.scope}
            - Better: ${formData.packages.better.scope}
            - Best: ${formData.packages.best.scope}
            **TASK:** Analyze the three packages. Generate key differences, recommend who should choose each package, and list 2-3 risks of choosing the cheapest 'Good' option.
            **OUTPUT FORMAT:** You MUST return ONLY a single, valid JSON object that strictly adheres to the provided schema. Do not include any other text, markdown, or explanations.`;
        
        default:
            return '';
    }
};


// --- API CALL LOGIC ---
const callGeminiApi = async (model: string, prompt: string, schema: any, temperature: number = 0.3) => {
    try {
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
        return JSON.parse(jsonText);
    } catch (error) {
        console.error(`Error calling Gemini API with model ${model}:`, error);
        // Re-throw the error to be caught by the fallback mechanism
        throw error;
    }
};

const withFallback = async <T>(
    primaryModel: string,
    fallbackModel: string,
    prompt: string,
    schema: any,
    temperature: number,
    onRetry: () => void
): Promise<T> => {
    try {
        return await callGeminiApi(primaryModel, prompt, schema, temperature);
    } catch (error) {
        console.warn(`Primary model (${primaryModel}) failed. Retrying with fallback (${fallbackModel})...`, error);
        onRetry();
        // If the fallback also fails, this will throw and be caught by the top-level handler in App.tsx
        return await callGeminiApi(fallbackModel, prompt, schema, temperature);
    }
};

// --- EXPORTED GENERATION FUNCTIONS ---

export const generateProposalContent = async (
    formData: FormData,
    quotes: { [key in PackageTier]?: Quote },
    selectedTrade: string,
    selectedProject: string,
    onRetry: () => void
): Promise<GeneratedContent> => {
    const payload = { formData, quotes, selectedTrade, selectedProject };
    const prompt = buildOptimizedPrompt('proposalContent', payload);
    const schema = {
        type: Type.OBJECT,
        properties: {
            cover_letter: { type: Type.STRING },
            scope_of_work: { type: Type.ARRAY, items: { type: Type.STRING } },
            inclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
            exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
            schedule_notes: { type: Type.STRING },
            risk_assessment: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { risk: { type: Type.STRING }, mitigation: { type: Type.STRING } }, required: ["risk", "mitigation"] } },
            payment_schedule: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { milestone: { type: Type.STRING }, percent: { type: Type.NUMBER } }, required: ["milestone", "percent"] } },
            warranty: { type: Type.STRING },
            terms_conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            acceptance_block: { type: Type.STRING },
        },
        required: ["cover_letter", "scope_of_work", "inclusions", "exclusions", "schedule_notes", "risk_assessment", "payment_schedule", "warranty", "terms_conditions", "acceptance_block"]
    };
    return withFallback('gemini-2.5-flash', 'gemini-2.5-pro', prompt, schema, 0.3, onRetry);
};

export const generateUpsellSuggestions = async (
    formData: FormData,
    quotes: { [key in PackageTier]?: Quote },
    selectedTrade: string,
    selectedProject: string,
    onRetry: () => void
): Promise<UpsellSuggestion[]> => {
    const payload = { formData, quotes, selectedTrade, selectedProject };
    const prompt = buildOptimizedPrompt('upsells', payload);
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, why_it_matters: { type: Type.STRING }, line_item: { type: Type.STRING } }, required: ["name", "why_it_matters", "line_item"] } };
    return withFallback('gemini-2.5-flash', 'gemini-2.5-pro', prompt, schema, 0.5, onRetry);
};

export const generatePackageComparison = async (
    formData: FormData,
    quotes: { [key in PackageTier]?: Quote },
    selectedTrade: string,
    selectedProject: string,
    onRetry: () => void
): Promise<PackageComparison> => {
    const payload = { formData, quotes, selectedTrade, selectedProject };
    const prompt = buildOptimizedPrompt('comparison', payload);
    const schema = { type: Type.OBJECT, properties: { differences: { type: Type.ARRAY, items: { type: Type.STRING } }, who_should_choose: { type: Type.OBJECT, properties: { good: { type: Type.STRING }, better: { type: Type.STRING }, best: { type: Type.STRING } }, required: ["good", "better", "best"] }, risk_notes: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["differences", "who_should_choose", "risk_notes"] };
    return withFallback('gemini-2.5-flash', 'gemini-2.5-pro', prompt, schema, 0.3, onRetry);
};

export const generateFollowUpEmails = async (formData: FormData, quote: Quote, selectedProject: string): Promise<FollowUpEmail[]> => {
    const prompt = `**ROLE:** You are an automated assistant for ${formData.brand}.\n**TASK:** Generate a JSON array of 3 email objects (subject, body, send_after_days).\n**PROPOSAL CONTEXT:** Project: ${selectedProject}, Price: ${quote.grandTotal} ${quote.currency}, Validity: ${formData.validity} days.\n**EMAILS:** 1. Reminder (Day 2), 2. Value Prop (Day 5), 3. Final Notice (Day 10).\n**OUTPUT FORMAT:** Return ONLY a single, valid JSON array.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, body: { type: Type.STRING }, send_after_days: { type: Type.NUMBER } }, required: ["subject", "body", "send_after_days"] } };
    // No fallback needed for this less critical, faster task
    return callGeminiApi('gemini-2.5-flash', prompt, schema, 0.5);
};

export const generateChangeOrder = async (changeRequest: string, formData: FormData, quote: Quote, selectedProject: string): Promise<ChangeOrder> => {
    const prompt = `**ROLE:** You are a project manager for ${formData.brand}.\n**ORIGINAL CONTEXT:** Project: ${selectedProject}, Total: ${quote.grandTotal} ${quote.currency}.\n**CLIENT REQUEST:** "${changeRequest}"\n**TASK:** Generate a structured change order JSON object (summary, added/removed scope, price_delta, schedule_delta).\n**OUTPUT FORMAT:** Return ONLY a single, valid JSON object.`;
    const schema = { type: Type.OBJECT, properties: { change_order_summary: { type: Type.STRING }, added_scope: { type: Type.ARRAY, items: { type: Type.STRING } }, removed_scope: { type: Type.ARRAY, items: { type: Type.STRING } }, price_delta: { type: Type.OBJECT, properties: { items: { type: Type.ARRAY, items: { type: Type.STRING } }, notes: { type: Type.STRING } }, required: ["items", "notes"] }, schedule_delta: { type: Type.STRING } }, required: ["change_order_summary", "added_scope", "removed_scope", "price_delta", "schedule_delta"] };
    // No fallback needed for this less critical, faster task
    return callGeminiApi('gemini-2.5-flash', prompt, schema, 0.3);
};