import React, { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import InputForm from './components/InputForm';
import ProposalPreview from './components/ProposalPreview';
import type {
  FormData,
  Quote,
  GeneratedContent,
  UpsellSuggestion,
  PackageComparison,
  FollowUpEmail,
  ChangeOrder,
  PackageTier,
} from './types';
import { calculateQuote } from './utils/quoteCalculator';
import {
  generateProposalContent,
  generateFollowUpEmails,
  generateChangeOrder,
} from './utils/gemini';
import { PRESETS } from './data/presets';
import { useToast } from './context/ToastContext';

const initialTrade = 'Electrical';
const initialProject = 'Panel Upgrade (200A)';

// Robustly get initial form data, with a fallback to prevent startup crashes.
const getInitialFormData = (): FormData => {
  try {
    const tradeData = PRESETS[initialTrade];
    const projectData = tradeData?.jobs?.[initialProject];
    if (projectData) {
      return projectData;
    }
  } catch (e) {
    console.error("Could not load default preset, falling back.", e);
  }
  
  // Fallback to the very first available preset if the default is not found
  const firstTrade = Object.keys(PRESETS)[0];
  const firstProject = Object.keys(PRESETS[firstTrade].jobs)[0];
  return PRESETS[firstTrade].jobs[firstProject];
};

const initialFormData = getInitialFormData();


const SparkQuoteLogo = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
        <defs>
            <linearGradient id="logoGradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--primary)" />
                <stop offset="1" stopColor="var(--info)" />
            </linearGradient>
        </defs>
        <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4Z" fill="url(#logoGradient)" />
        <path d="M22.53 15.5L16.5 24.5H25.5L24.47 20.5H29.5L22.53 15.5Z" fill="white" fillOpacity="0.9" />
        <path d="M25.47 32.5L31.5 23.5H22.5L23.53 27.5H18.5L25.47 32.5Z" fill="white" fillOpacity="0.9" />
    </svg>
);


function App() {
  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const savedData = localStorage.getItem('proposalFormData');
      return savedData ? JSON.parse(savedData) : initialFormData;
    } catch (error) {
      console.error('Error loading from localStorage', error);
      return initialFormData;
    }
  });
  const [selectedTrade, setSelectedTrade] = useState<string>(
    () => localStorage.getItem('selectedTrade') || initialTrade
  );
  const [selectedProject, setSelectedProject] = useState<string>(
    () => localStorage.getItem('selectedProject') || initialProject
  );

  const [quotes, setQuotes] = useState<{ [key in PackageTier]?: Quote }>({});
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [upsellSuggestions, setUpsellSuggestions] = useState<
    UpsellSuggestion[]
  >([]);
  const [packageComparison, setPackageComparison] =
    useState<PackageComparison | null>(null);
  const [followUpEmails, setFollowUpEmails] = useState<FollowUpEmail[]>([]);
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    'Saved' | 'Saving...' | 'Not Saved'
  >('Saved');
  const [generationTimestamp, setGenerationTimestamp] = useState<number | null>(
    null
  );
  const { addToast } = useToast();

  // Load preset when trade/project changes
  useEffect(() => {
    if (selectedTrade && selectedProject) {
      const presetData = PRESETS[selectedTrade]?.jobs[selectedProject];
      if (presetData) {
        setFormData(presetData);
      }
    }
  }, [selectedTrade, selectedProject]);

  // Recalculate quotes when relevant form data changes
  useEffect(() => {
    const { packages, ...restOfData } = formData;
    const newQuotes: { [key in PackageTier]?: Quote } = {};
    (Object.keys(packages) as PackageTier[]).forEach((tier) => {
      const packageDetails = packages[tier];
      if (packageDetails.materialLineItems || packageDetails.laborLineItems) {
        newQuotes[tier] = calculateQuote(
          packageDetails.materialLineItems,
          packageDetails.laborLineItems,
          restOfData
        );
      }
    });
    setQuotes(newQuotes);
  }, [formData]);

  // Save to localStorage
  const debouncedSave = useDebouncedCallback(() => {
    try {
      localStorage.setItem('proposalFormData', JSON.stringify(formData));
      localStorage.setItem('selectedTrade', selectedTrade);
      localStorage.setItem('selectedProject', selectedProject);
      setSaveStatus('Saved');
    } catch (error) {
      console.error('Error saving to localStorage', error);
      setSaveStatus('Not Saved');
    }
  }, 1000);

  useEffect(() => {
    setSaveStatus('Saving...');
    debouncedSave();
  }, [formData, selectedTrade, selectedProject, debouncedSave]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setFollowUpEmails([]);
    setChangeOrder(null);
    setPackageComparison(null);
    setUpsellSuggestions([]);
    setGenerationTimestamp(null);

    try {
      const { generatedContent, upsellSuggestions, packageComparison } =
        await generateProposalContent(
          formData,
          quotes,
          selectedTrade,
          selectedProject
        );
      setGeneratedContent(generatedContent);
      setUpsellSuggestions(upsellSuggestions);
      setPackageComparison(packageComparison);
      setGenerationTimestamp(Date.now());
      addToast('Proposal generated successfully!', 'success');


      // Also generate follow-up emails, using the 'better' quote as context
      if (quotes.better) {
        const emails = await generateFollowUpEmails(
          formData,
          quotes.better,
          selectedProject
        );
        setFollowUpEmails(emails);
      }
    } catch (err) {
       const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
      addToast(message, 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateChangeOrder = async (changeRequest: string) => {
    if (!quotes.better) {
      const message = 'Cannot generate a change order without a base quote.';
      setError(message);
      addToast(message, 'error');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const order = await generateChangeOrder(
        changeRequest,
        formData,
        quotes.better,
        selectedProject
      );
      setChangeOrder(order);
      addToast('Change order generated!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate change order.';
      setError(message);
      addToast(message, 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuickGenerate = () => {
    const mainGenBtn = document.getElementById('generateBtn');
    if (mainGenBtn) {
        mainGenBtn.click();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] font-sans">
      <main className="grid lg:grid-cols-[480px,1fr] gap-4 mx-auto max-w-7xl p-4">
        
        {/* Left: Builder */}
        <section className="glass card p-4 md:p-6 flex flex-col h-fit">
          <header className="mb-6">
            <SparkQuoteLogo />
            <h1 className="text-xl sm:text-2xl font-bold">SparkQuote AI</h1>
            <p className="text-[var(--muted)]">AI-Powered Proposal Generator</p>
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
        </section>

        {/* Right: Preview & actions. This column will scroll */}
        <div className="lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <ProposalPreview
            formData={formData}
            setFormData={setFormData}
            quotes={quotes}
            generatedContent={generatedContent}
            generationTimestamp={generationTimestamp}
            upsellSuggestions={upsellSuggestions}
            packageComparison={packageComparison}
            followUpEmails={followUpEmails}
            changeOrder={changeOrder}
            onGenerateChangeOrder={handleGenerateChangeOrder}
            isLoading={isLoading}
            error={error}
            selectedProject={selectedProject}
          />
        </div>
      </main>
      
      {/* Sticky action strip on mobile */}
      <div className="print:hidden fixed inset-x-0 bottom-3 px-3 md:hidden" style={{pointerEvents:'none'}}>
        <div className="glass card flex gap-2 p-2 justify-between" style={{pointerEvents:'auto'}}>
          <button id="quickGen" className="btn-primary flex-1" onClick={handleQuickGenerate}>Generate</button>
          <button onClick={() => window.print()} className="btn-secondary">PDF</button>
        </div>
      </div>
    </div>
  );
}

export default App;