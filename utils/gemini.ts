import type { FormData, Quote, GeneratedContent, UpsellSuggestion, PackageComparison, FollowUpEmail, ChangeOrder, PackageTier } from '../types';

const API_ENDPOINT = '/api/generate';

const callApi = async (generationType: string, payload: object) => {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generationType, payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown API error occurred.' }));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return response.json();
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
    return callApi('proposal', { formData, quotes, selectedTrade, selectedProject });
};

export const generateFollowUpEmails = async (formData: FormData, quote: Quote, selectedProject: string): Promise<FollowUpEmail[]> => {
    return callApi('followups', { formData, quote, selectedProject });
};

export const generateChangeOrder = async (changeRequest: string, formData: FormData, quote: Quote, selectedProject: string): Promise<ChangeOrder> => {
    return callApi('changeorder', { changeRequest, formData, quote, selectedProject });
};
