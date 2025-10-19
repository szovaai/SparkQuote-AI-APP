import React, { useState, useEffect, useCallback } from 'react';
// FIX: Correctly import GoogleGenAI from '@google/genai' per guidelines.
import { GoogleGenAI } from "@google/genai";
import InputForm from './components/InputForm';
import ProposalPreview from './components/ProposalPreview';
import type { FormData, Quote, PackageTier, UpsellSuggestion } from './types';
import { calculateQuote } from './utils/quoteCalculator';
import { PRESETS } from './data/presets';

const initialTrade = Object.keys(PRESETS)[0];
const initialProject = Object.keys(PRESETS[initialTrade].jobs)[0];
const initialFormData = PRESETS[initialTrade].jobs[initialProject];

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generatedProposal, setGeneratedProposal] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [quotes, setQuotes] = useState<{ [key in PackageTier]?: Quote }>({});
  const [clientSignature, setClientSignature] = useState<string>('');
  const [selectedTrade, setSelectedTrade] = useState<string>(initialTrade);
  const [selectedProject, setSelectedProject] = useState<string>(initialProject);
  const [selectedPackage, setSelectedPackage] = useState<PackageTier>('better');
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Not Saved'>('Not Saved');
  const [upsellSuggestions, setUpsellSuggestions] = useState<UpsellSuggestion[] | null>(null);
  const [proposalCounter, setProposalCounter] = useState<number>(() => {
    const savedCounter = localStorage.getItem('proposalCounter');
    return savedCounter ? parseInt(savedCounter, 10) : 1;
  });

  const updateFormDataFromPreset = useCallback(() => {
    if (PRESETS[selectedTrade] && PRESETS[selectedTrade].jobs[selectedProject]) {
      const newFormData = PRESETS[selectedTrade].jobs[selectedProject];
      setFormData(newFormData);
    }
  }, [selectedTrade, selectedProject]);
  
  useEffect(() => {
    updateFormDataFromPreset();
  }, [selectedTrade, selectedProject, updateFormDataFromPreset]);

  // Debounced save to local storage
  useEffect(() => {
    // A simple way to check if form data is not the initial default before trying to save.
    if (JSON.stringify(formData) !== JSON.stringify(PRESETS[selectedTrade].jobs[selectedProject])) {
      setSaveStatus('Saving...');
      const handler = setTimeout(() => {
        localStorage.setItem('formData', JSON.stringify(formData));
        localStorage.setItem('selectedTrade', selectedTrade);
        localStorage.setItem('selectedProject', selectedProject);
        setSaveStatus('Saved');
      }, 1000);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [formData, selectedTrade, selectedProject]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('formData');
      const savedTrade = localStorage.getItem('selectedTrade');
      const savedProject = localStorage.getItem('selectedProject');

      if (savedTrade) setSelectedTrade(savedTrade);
      if (savedProject) setSelectedProject(savedProject);
      if (savedData) {
        setFormData(JSON.parse(savedData));
        setSaveStatus('Saved');
      }
    } catch (error) {
      console.error("Failed to parse saved form data:", error);
    }
  }, []);

  const handleAddUpsell = (suggestion: UpsellSuggestion) => {
    setFormData(prev => {
      const currentPackage = prev.packages[selectedPackage];
      // Adds the new item with a placeholder cost for the user to update
      const newMaterialLineItems = `${currentPackage.materialLineItems}\n${suggestion.name} | 1 | ea | 0`;
      
      return {
        ...prev,
        packages: {
          ...prev.packages,
          [selectedPackage]: {
            ...currentPackage,
            materialLineItems: newMaterialLineItems
          }
        }
      };
    });
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedProposal('');
    setUpsellSuggestions(null);

    // Increment and save the proposal counter for the new proposal
    setProposalCounter(prevCounter => {
        const newCounter = prevCounter + 1;
        localStorage.setItem('proposalCounter', newCounter.toString());
        return newCounter;
    });

    // Calculate quotes for all packages
    const newQuotes: { [key in PackageTier]?: Quote } = {};
    const packageTiers: PackageTier[] = ['good', 'better', 'best'];
    
    for (const tier of packageTiers) {
      const packageData = formData.packages[tier];
      if (packageData.scope && (packageData.materialLineItems || packageData.laborLineItems)) {
         const { packages, ...restOfData } = formData;
         newQuotes[tier] = calculateQuote(
          packageData.materialLineItems,
          packageData.laborLineItems,
          restOfData
        );
      }
    }
    setQuotes(newQuotes);

    // AI Generation
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      const termsPrompt = `
        You are an expert contract writer for trade services. Based on the following job details, generate a standard "Terms & Conditions" section for a proposal.
        The tone should be professional, clear, and fair to both the contractor and the client.
        
        Job Summary: ${formData.summary}
        Trade: ${selectedTrade}
        
        Generate the Terms & Conditions section covering:
        1. Scope of Work, 2. Payment Terms, 3. Changes to Work, 4. Client Responsibilities, 5. Warranty (${formData.warranty} months), 6. Exclusions, 7. Cancellation, 8. Acceptance.
        
        Keep it concise and easy to understand. Do not include a title like "Terms & Conditions".
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: termsPrompt,
      });

      setGeneratedProposal(response.text);

      // Second call for upsell suggestions
      const upsellPrompt = `
        Based on the following job summary for a ${selectedTrade} project, suggest 2-3 relevant upsell items.
        These should be items that add value, safety, or convenience for the client.
        
        Job Summary: ${formData.summary}
        
        Return your answer as a JSON array of objects, where each object has a "name" and a "description" key.
        Do not include any other text or markdown formatting.
        
        Example format:
        [
          { "name": "Whole-Home Surge Protector", "description": "Protects all your sensitive electronics from power surges." },
          { "name": "Smart Dimmer Switches", "description": "Control your lighting with your voice or phone for convenience and energy savings." }
        ]
      `;

      const upsellResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: upsellPrompt,
      });

      try {
        const upsellText = upsellResponse.text.replace(/^```json|```$/g, '').trim();
        const suggestions = JSON.parse(upsellText);
        setUpsellSuggestions(suggestions);
      } catch (e) {
        console.error("Failed to parse upsell suggestions:", e);
        // Fail silently on upsell errors
      }


    } catch (error) {
      console.error("Error generating proposal:", error);
      setGeneratedProposal("Error: Could not generate terms and conditions. Please check your API key and connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-alt)] font-sans text-[var(--fg)]">
      <aside className="w-[450px] h-screen bg-[var(--bg)] flex flex-col p-6 shadow-md overflow-y-auto print:hidden">
        <header className="mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-xl font-bold">SparkQuote AI</h1>
              <p className="text-sm text-[var(--muted)]">Generate polished proposals in seconds.</p>
            </div>
        </header>
        <InputForm
          formData={formData}
          setFormData={setFormData}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          selectedTrade={selectedTrade}
          setSelectedTrade={setSelectedTrade}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          saveStatus={saveStatus}
        />
      </aside>
      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        <ProposalPreview 
          formData={formData}
          quotes={quotes}
          generatedProposal={generatedProposal}
          clientSignature={clientSignature}
          setClientSignature={setClientSignature}
          selectedPackage={selectedPackage}
          setSelectedPackage={setSelectedPackage}
          isLoading={isLoading}
          upsellSuggestions={upsellSuggestions}
          onAddUpsell={handleAddUpsell}
          proposalNumber={proposalCounter}
        />
      </main>
    </div>
  );
};

export default App;