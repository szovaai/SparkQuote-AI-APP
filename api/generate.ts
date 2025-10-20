import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import type { FormData, Quote, PackageTier } from './types';

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
        const { generationType, payload, model: requestedModel } = req.body;
        
        const model = requestedModel || 'gemini-2.5-flash';

        let prompt;
        let schema;
        let temperature = 0.3;

        switch (generationType) {
            case 'proposalContent':
                prompt = buildOptimizedPrompt('proposalContent', payload);
                schema = {
                    type: Type.OBJECT,
                    properties: {
                        cover_letter: { type: Type.STRING },
                        scope_of_work: { type: Type.ARRAY, items: { type: Type.STRING } },
                        inclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        schedule_notes: { type: Type.STRING },
                        risk_assessment: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { risk: { type: Type.STRING }, mitigation: { type: Type.STRING } } } },
                        payment_schedule: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { milestone: { type: Type.STRING }, percent: { type: Type.NUMBER } } } },
                        warranty: { type: Type.STRING },
                        terms_conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        acceptance_block: { type: Type.STRING },
                    }
                };
                break;

            case 'upsells':
                prompt = buildOptimizedPrompt('upsells', payload);
                schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, why_it_matters: { type: Type.STRING }, line_item: { type: Type.STRING } } } };
                temperature = 0.5;
                break;

            case 'comparison':
                prompt = buildOptimizedPrompt('comparison', payload);
                schema = { type: Type.OBJECT, properties: { differences: { type: Type.ARRAY, items: { type: Type.STRING } }, who_should_choose: { type: Type.OBJECT, properties: { good: { type: Type.STRING }, better: { type: Type.STRING }, best: { type: Type.STRING } } }, risk_notes: { type: Type.ARRAY, items: { type: Type.STRING } } } };
                break;

            case 'followups':
                // This is less performance-critical, can keep its simpler prompt
                prompt = `**ROLE:** You are an automated assistant for ${payload.formData.brand}.\n**TASK:** Generate a JSON array of 3 email objects (subject, body, send_after_days).\n**PROPOSAL CONTEXT:** Project: ${payload.selectedProject}, Price: ${payload.quote.grandTotal} ${payload.quote.currency}, Validity: ${payload.formData.validity} days.\n**EMAILS:** 1. Reminder (Day 2), 2. Value Prop (Day 5), 3. Final Notice (Day 10).\n**OUTPUT FORMAT:** Return ONLY a single, valid JSON array.`;
                schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, body: { type: Type.STRING }, send_after_days: { type: Type.NUMBER } } } };
                temperature = 0.5;
                break;

            case 'changeorder':
                 // This is less performance-critical, can keep its simpler prompt
                prompt = `**ROLE:** You are a project manager for ${payload.formData.brand}.\n**ORIGINAL CONTEXT:** Project: ${payload.selectedProject}, Total: ${payload.quote.grandTotal} ${payload.quote.currency}.\n**CLIENT REQUEST:** "${payload.changeRequest}"\n**TASK:** Generate a structured change order JSON object (summary, added/removed scope, price_delta, schedule_delta).\n**OUTPUT FORMAT:** Return ONLY a single, valid JSON object.`;
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