import React, { useState, useRef, useEffect } from 'react';
import type {
  FormData,
  Quote,
  GeneratedContent,
  UpsellSuggestion,
  PackageComparison,
  FollowUpEmail,
  ChangeOrder,
  PackageTier,
  LineItem,
} from '../types';
import { formatCurrency } from '../utils/quoteCalculator';
import SignaturePad from './SignaturePad';

interface ProposalPreviewProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  quotes: { [key in PackageTier]?: Quote };
  generatedContent: GeneratedContent | null;
  generationTimestamp: number | null;
  upsellSuggestions: UpsellSuggestion[];
  packageComparison: PackageComparison | null;
  followUpEmails: FollowUpEmail[];
  changeOrder: ChangeOrder | null;
  onGenerateChangeOrder: (changeRequest: string) => void;
  isLoading: boolean;
  error: string | null;
  selectedProject: string;
}

type Tab = 'proposal' | 'comparison' | 'upsells' | 'followups' | 'changeorder';

// Icon Components for Sidebar Navigation
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
const ScaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c-1.472 0-2.882.265-4.185.75M12 12.75h.008v.008H12v-.008Z" /></svg>;
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
const SparkQuoteLogo = () => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoGradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--proposal-primary, var(--primary))" />
                <stop offset="1" stopColor="var(--proposal-secondary, var(--info))" />
            </linearGradient>
        </defs>
        <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4Z" fill="url(#logoGradient)" />
        <path d="M22.53 15.5L16.5 24.5H25.5L24.47 20.5H29.5L22.53 15.5Z" fill="white" fillOpacity="0.9" />
        <path d="M25.47 32.5L31.5 23.5H22.5L23.53 27.5H18.5L25.47 32.5Z" fill="white" fillOpacity="0.9" />
    </svg>
);


const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-8 break-inside-avoid">
    <h2 className="text-lg sm:text-xl font-bold border-b-2 border-[var(--proposal-primary)] pb-2 mb-4 text-[var(--proposal-primary)]">
      {title}
    </h2>
    <div className="prose prose-sm max-w-none text-[var(--fg)] prose-p:text-[var(--fg)] prose-ul:text-[var(--fg)] prose-li:text-[var(--fg)] prose-strong:text-[var(--fg)]">
      {children}
    </div>
  </div>
);

const LineItemsTable: React.FC<{ items: LineItem[]; currency: string }> = ({
  items,
  currency,
}) => (
  <table className="w-full text-left text-sm mt-4">
    <thead className="border-b border-[var(--line)] text-[var(--muted)]">
      <tr>
        <th className="font-semibold p-2">Description</th>
        <th className="font-semibold p-2 text-right">Qty</th>
        <th className="font-semibold p-2 text-right">Rate</th>
        <th className="font-semibold p-2 text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item, index) => (
        <tr key={index} className="border-b border-[var(--line)]">
          <td className="p-2">{item.desc}</td>
          <td className="p-2 text-right">
            {item.qty} {item.unit}
          </td>
          <td className="p-2 text-right">
            {formatCurrency(item.rate, currency)}
          </td>
          <td className="p-2 text-right">
            {formatCurrency(item.amount, currency)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const QuoteTotals: React.FC<{ quote: Quote }> = ({ quote }) => (
  <div className="mt-6 ml-auto w-full max-w-xs text-sm">
    <div className="flex justify-between py-1 border-b border-[var(--line)]">
      <span>Subtotal</span>
      <span>{formatCurrency(quote.subTotal, quote.currency)}</span>
    </div>
    {quote.discountPercent > 0 && (
      <div className="flex justify-between py-1 border-b border-[var(--line)]">
        <span>Discount ({quote.discountPercent}%)</span>
        <span className="text-green-500">
          -{formatCurrency(quote.discountAmount, quote.currency)}
        </span>
      </div>
    )}
    <div className="flex justify-between py-1 border-b border-[var(--line)]">
      <span>Tax ({quote.taxPercent}%)</span>
      <span>{formatCurrency(quote.taxAmount, quote.currency)}</span>
    </div>
    <div className="flex justify-between py-2 font-bold text-base">
      <span>Grand Total</span>
      <span>{formatCurrency(quote.grandTotal, quote.currency)}</span>
    </div>
    <div className="flex justify-between py-2 mt-2 font-bold text-base bg-[var(--proposal-primary)]/20 p-2 rounded-md">
      <span>Deposit Due ({quote.depositPercent}%)</span>
      <span>{formatCurrency(quote.depositDue, quote.currency)}</span>
    </div>
  </div>
);

const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  formData,
  setFormData,
  quotes,
  generatedContent,
  generationTimestamp,
  upsellSuggestions,
  packageComparison,
  followUpEmails,
  changeOrder,
  onGenerateChangeOrder,
  isLoading,
  error,
  selectedProject,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('proposal');
  const [selectedTier, setSelectedTier] = useState<PackageTier>('better');
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [signerName, setSignerName] = useState('');
  const [isAccepted, setIsAccepted] = useState(false);
  const [acceptanceDate, setAcceptanceDate] = useState<Date | null>(null);
  const [changeRequest, setChangeRequest] = useState('');
  const [checkedUpsells, setCheckedUpsells] = useState<string[]>([]);
  const [copiedEmailIndex, setCopiedEmailIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [badgeColor, setBadgeColor] = useState('var(--muted)');
  const signaturePadRef = useRef<{ clear: () => void }>(null);

  const { primaryColor, secondaryColor } = formData;
  const proposalStyles = {
    '--proposal-primary': primaryColor || 'var(--primary)',
    '--proposal-secondary': secondaryColor || 'var(--secondary)',
  } as React.CSSProperties;

  useEffect(() => {
    // Reset checked upsells and selected tier when a new proposal is generated
    setCheckedUpsells([]);
    setSelectedTier('better');
  }, [generatedContent]);

  useEffect(() => {
    if (!generationTimestamp) {
        setTimeLeft('');
        return;
    }

    const calculateTimeLeft = () => {
        const expiryDate = new Date(generationTimestamp + formData.validity * 86400000);
        const diff = expiryDate.getTime() - new Date().getTime();

        if (diff <= 0) {
            setTimeLeft('Expired');
            setBadgeColor('var(--error)');
            clearInterval(interval);
            return;
        }

        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        setTimeLeft(`Valid for ${days} more day${days > 1 ? 's' : ''}`);
        
        if (days <= 2) setBadgeColor('var(--error)');
        else if (days <= 5) setBadgeColor('var(--secondary)');
        else setBadgeColor('var(--muted)');
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [generationTimestamp, formData.validity]);
  
  const handleAccept = () => {
    const acceptedQuote = quotes[selectedTier];
    if (!signerName.trim() || !signatureDataUrl || !acceptedQuote) {
      return; // Button should be disabled, but this is a safeguard
    }

    const date = new Date();
    setAcceptanceDate(date);

    const payload = {
      proposalTitle: selectedProject,
      signer: signerName.trim(),
      signedAt: date.toISOString(),
      signaturePNG: signatureDataUrl,
      packageAccepted: selectedTier,
      totalAccepted: acceptedQuote.grandTotal,
      currency: acceptedQuote.currency,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const proposalNumber = `${formData.proposalNumberPrefix}-${String(
      new Date().getFullYear()
    ).slice(-2)}${new Date().getMonth() + 1}-001`;
    a.download = `Acceptance-Receipt-${proposalNumber}.json`;
    a.click();
    URL.revokeObjectURL(a.href);

    setIsAccepted(true);
  };

  const handleUpsellToggle = (isChecked: boolean, lineItem: string) => {
    const currentItems = formData.packages.better.materialLineItems.split('\n').filter(l => l.trim() !== '');
    const isPresent = currentItems.includes(lineItem);
    
    let updatedItems;
    if (isChecked && !isPresent) {
        updatedItems = [...currentItems, lineItem];
    } else if (!isChecked && isPresent) {
        updatedItems = currentItems.filter(item => item !== lineItem);
    } else {
        return; // No change needed
    }

    setCheckedUpsells(prev => isChecked ? [...prev, lineItem] : prev.filter(item => item !== lineItem));
    
    setFormData(prev => ({
        ...prev,
        packages: {
            ...prev.packages,
            better: {
                ...prev.packages.better,
                materialLineItems: updatedItems.join('\n'),
            }
        }
    }));
  };

  const handleCopyEmail = (email: FollowUpEmail, index: number) => {
    const emailText = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(emailText).then(() => {
        setCopiedEmailIndex(index);
        setTimeout(() => setCopiedEmailIndex(null), 2500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  const tabs: { id: Tab; label: string, icon: React.ReactNode }[] = [
    { id: 'proposal', label: 'Proposal', icon: <DocumentIcon /> },
    { id: 'comparison', label: 'Comparison', icon: <ScaleIcon /> },
    { id: 'upsells', label: 'Upsells', icon: <ArrowUpIcon /> },
    { id: 'followups', label: 'Follow-ups', icon: <MailIcon /> },
    { id: 'changeorder', label: 'Change Order', icon: <PencilIcon /> },
  ];
  
  const ContentPlaceholder: React.FC<{ title: string; message: string; subtext?: string }> = ({ title, message, subtext }) => (
    <Section title={title}>
      <div className="text-center p-10 border-2 border-dashed border-[var(--line)] rounded-lg bg-[var(--bg)]">
        <p className="text-lg font-semibold text-[var(--muted)]">{message}</p>
        <p className="text-sm text-[var(--muted)] mt-2">
          {subtext || 'Click the "Generate Invoice" button to have the AI create this content for you.'}
        </p>
      </div>
    </Section>
  );
  
  const PackageSwitcher: React.FC<{selectedTier: PackageTier, onSelectTier: (tier: PackageTier) => void}> = ({ selectedTier, onSelectTier }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[var(--bg)] p-2 rounded-lg border border-[var(--line)] my-6">
      {(['good', 'better', 'best'] as PackageTier[]).map(tier => (
        <button
          key={tier}
          onClick={() => onSelectTier(tier)}
          className={`px-3 py-2 text-sm font-bold rounded-md capitalize transition-all text-center ${selectedTier === tier ? 'bg-[var(--proposal-primary)] text-[var(--bg-alt)] shadow-lg' : 'bg-transparent text-[var(--muted)] hover:bg-[var(--line)]'}`}
        >
          <span className="block">{tier}</span>
          {quotes[tier] && <span className="text-xs font-normal opacity-90">{formatCurrency(quotes[tier]!.grandTotal, quotes[tier]!.currency)}</span>}
        </button>
      ))}
    </div>
  );

  const renderProposal = () => {
    const currentQuote = quotes[selectedTier];
    const scopeItems = formData.packages[selectedTier].scope.split('\n').filter(line => line.trim() !== '');

    return <>
      <header className="flex flex-col sm:flex-row justify-between items-start mb-12 gap-4">
        <div className="flex items-center gap-3">
          <SparkQuoteLogo />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{formData.brand}</h1>
            <p className="text-[var(--muted)]">License #: {formData.license}</p>
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold">Proposal</h2>
          <p className="text-[var(--muted)]">
            #
            {`${formData.proposalNumberPrefix}-${String(
              new Date().getFullYear()
            ).slice(-2)}${new Date().getMonth() + 1}-001`}
          </p>
          <p className="text-[var(--muted)]">
            Date: {new Date().toLocaleDateString()}
          </p>
           {timeLeft && (
              <p className="text-xs font-semibold mt-1 px-2 py-1 rounded-full" style={{ color: badgeColor, backgroundColor: `${badgeColor}20` }}>
                  {timeLeft}
              </p>
           )}
        </div>
      </header>

      <Section title="Cover Letter">{generatedContent!.cover_letter}</Section>
      
      {formData.attachments && formData.attachments.length > 0 && (
          <Section title="Reference Documents">
            <ul className="list-disc pl-5 space-y-1">
              {formData.attachments.map((attachment, i) => (
                <li key={i}>
                  {attachment.startsWith('http') ? (
                    <a href={attachment} target="_blank" rel="noopener noreferrer" className="text-[var(--proposal-primary)] hover:underline break-all">
                      {attachment}
                    </a>
                  ) : (
                    <span className="break-all">{attachment}</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
      )}

      <PackageSwitcher selectedTier={selectedTier} onSelectTier={setSelectedTier} />

      <Section title={`Scope of Work (${selectedTier})`}>
        <ul className="list-disc pl-5">
          {scopeItems.map((item, i) => (
            <li key={i}>{item.startsWith('- ') ? item.substring(2) : item}</li>
          ))}
        </ul>
      </Section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Section title="Inclusions">
          <ul className="list-disc pl-5">
            {generatedContent!.inclusions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
        <Section title="Exclusions">
          <ul className="list-disc pl-5">
            {generatedContent!.exclusions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      </div>
      <Section title={`Investment (${selectedTier})`}>
        {currentQuote ? (
          <div>
            <LineItemsTable
              items={currentQuote.items}
              currency={currentQuote.currency}
            />
            <QuoteTotals quote={currentQuote} />
          </div>
        ) : (
          <p>Pricing details not available for this package.</p>
        )}
      </Section>
      <Section title="Schedule & Payment">
        <p>{generatedContent!.schedule_notes}</p>
        <h4 className="font-bold mt-4 mb-2">Payment Schedule</h4>
        <ul className="list-disc pl-5">
          {generatedContent!.payment_schedule.map((item, i) => (
            <li key={i}>
              {item.milestone}: {item.percent}%
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Warranty">{generatedContent!.warranty}</Section>
      <Section title="Terms & Conditions">
        <ul className="list-decimal pl-5 space-y-2">
          {generatedContent!.terms_conditions.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="Acceptance">
        <p>{generatedContent!.acceptance_block}</p>
        
        {currentQuote && (
          <div className="font-bold text-lg my-4 p-4 bg-[var(--bg)] rounded-md text-center border border-[var(--line)]">
              Accepted Package: <span className="capitalize text-[var(--proposal-primary)]">{selectedTier}</span>
              <span className="mx-2 text-[var(--muted)]">|</span>
              Total Investment: <span className="text-[var(--proposal-primary)]">{formatCurrency(currentQuote.grandTotal, currentQuote.currency)}</span>
          </div>
        )}

        <div className={`mt-6 border border-[var(--line)] rounded-md p-4 ${isAccepted ? 'opacity-70' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                 <div>
                    <label htmlFor="signerName" className="block text-sm font-medium text-[var(--muted)] mb-1">1. Printed Name</label>
                    <input
                        type="text"
                        id="signerName"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="input"
                        placeholder="Type your full name"
                        disabled={isAccepted}
                        aria-label="Signer's full name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">2. Signature</label>
                    <div className="border border-[var(--line)] rounded-md">
                        <SignaturePad ref={signaturePadRef} onSignatureEnd={setSignatureDataUrl} disabled={isAccepted} />
                    </div>
                     <div className="flex justify-end items-center mt-1">
                        <button onClick={() => signaturePadRef.current?.clear()} className="btn-secondary text-xs" disabled={isAccepted}>Clear</button>
                    </div>
                </div>
            </div>
        </div>
        <div className="mt-6 flex flex-col items-start">
            {!isAccepted ? (
                <button
                  onClick={handleAccept}
                  disabled={!signerName.trim() || !signatureDataUrl || !currentQuote}
                  className="btn-primary w-full sm:w-auto"
                >
                  3. Accept & Sign Proposal
                </button>
            ) : (
                <div className="w-full p-4 bg-green-500/10 border border-green-500/30 text-green-300 rounded-md">
                  <h4 className="font-bold">✅ Proposal Accepted!</h4>
                  <p className="text-sm mt-1">A receipt has been downloaded. Thank you, {signerName}.</p>
                  {acceptanceDate && <p className="text-xs text-[var(--muted)] mt-1">Accepted on {acceptanceDate.toLocaleString()}</p>}
                </div>
            )}
        </div>
      </Section>
    </>;
  };

  const renderComparison = () => (
    <Section title="Package Comparison">
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-lg mb-2">Key Differences</h3>
                <ul className="list-disc pl-5 space-y-1">
                    {packageComparison!.differences.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
             <div>
                <h3 className="font-bold text-lg mb-2">Who Should Choose Which Package?</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold capitalize">Good</h4>
                        <p>{packageComparison!.who_should_choose.good}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold capitalize">Better</h4>
                        <p>{packageComparison!.who_should_choose.better}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold capitalize">Best</h4>
                        <p>{packageComparison!.who_should_choose.best}</p>
                    </div>
                </div>
            </div>
             <div>
                <h3 className="font-bold text-lg mb-2">Potential Risks of 'Good' Package</h3>
                 <ul className="list-disc pl-5 space-y-1">
                    {packageComparison!.risk_notes.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        </div>
    </Section>
  );

  const renderUpsells = () => (
    <Section title="Suggested Upsells & Add-ons">
        <p className="text-sm text-[var(--muted)] mb-4">Select any add-ons to include them in the 'Better' package and update the total investment.</p>
        <div className="space-y-4">
            {upsellSuggestions.map((item, i) => (
                <div key={i} className="p-4 border border-[var(--line)] rounded-md bg-[var(--bg)] transition-all has-[:checked]:bg-[var(--proposal-primary)]/10 has-[:checked]:border-[var(--proposal-primary)]/50">
                    <label className="flex items-start gap-4 cursor-pointer">
                        <input
                            type="checkbox"
                            className="mt-1 flex-shrink-0"
                            checked={checkedUpsells.includes(item.line_item)}
                            onChange={(e) => handleUpsellToggle(e.target.checked, item.line_item)}
                        />
                        <div className="flex-grow">
                             <h3 className="font-bold">{item.name}</h3>
                             <p className="text-sm my-1 text-[var(--muted)]">{item.why_it_matters}</p>
                             <div className="mt-2 pt-2 border-t border-[var(--line)] text-xs font-mono text-cyan-400">
                                 {item.line_item}
                             </div>
                        </div>
                    </label>
                </div>
            ))}
        </div>
    </Section>
  );

  const renderFollowUps = () => (
    <Section title="Follow-up Email Templates">
        <div className="space-y-4">
            {followUpEmails.map((email, i) => (
                <div key={i} className="p-4 border border-[var(--line)] rounded-md bg-[var(--bg)] relative group">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Subject: {email.subject}</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-[var(--muted)]">Send on Day +{email.send_after_days}</span>
                             <button 
                                onClick={() => handleCopyEmail(email, i)} 
                                className="btn-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-xs"
                            >
                                {copiedEmailIndex === i ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[var(--line)] whitespace-pre-wrap text-sm text-[var(--muted)]">
                        {email.body}
                    </div>
                </div>
            ))}
        </div>
    </Section>
  );

    const renderChangeOrder = () => (
    <>
        <Section title="Generate Change Order">
            <div className="space-y-4">
                <p className="text-sm text-[var(--muted)]">
                    Enter a change request in plain English to generate a formal change order document.
                    For example: "Upgrade the standard breakers to AFCI breakers and add an outlet in the garage."
                </p>
                <textarea
                    value={changeRequest}
                    onChange={(e) => setChangeRequest(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Enter change request here..."
                />
                <button
                    onClick={() => onGenerateChangeOrder(changeRequest)}
                    disabled={isLoading || !changeRequest}
                    className="btn-secondary"
                >
                    {isLoading ? 'Generating...' : 'Generate Change Order'}
                </button>
            </div>
        </Section>
        {changeOrder && (
            <Section title="Change Order Details">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Summary</h3>
                        <p>{changeOrder.change_order_summary}</p>
                    </div>
                     <div>
                        <h3 className="font-bold text-lg mb-2">Scope Changes</h3>
                        {changeOrder.added_scope.length > 0 && (
                            <>
                                <h4 className="font-semibold text-green-400">Added:</h4>
                                <ul className="list-disc pl-5">
                                    {changeOrder.added_scope.map((item, i) => <li key={`add-${i}`}>{item}</li>)}
                                </ul>
                            </>
                        )}
                         {changeOrder.removed_scope.length > 0 && (
                            <>
                                <h4 className="font-semibold text-red-400 mt-2">Removed:</h4>
                                <ul className="list-disc pl-5">
                                    {changeOrder.removed_scope.map((item, i) => <li key={`rem-${i}`}>{item}</li>)}
                                </ul>
                            </>
                        )}
                    </div>
                     <div>
                        <h3 className="font-bold text-lg mb-2">Price Delta</h3>
                        <table className="w-full text-left text-sm">
                            <tbody>
                            {changeOrder.price_delta.items.map((item, i) => {
                                const [desc, qty, unit, rate] = item.split('|').map(s => s.trim());
                                const amount = Number(qty) * Number(rate);
                                return (
                                    <tr key={i} className={amount >= 0 ? '' : 'text-red-400'}>
                                        <td className="p-1">{desc}</td>
                                        <td className="p-1 text-right">{formatCurrency(amount, formData.currency)}</td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                        <p className="text-xs italic mt-2 text-[var(--muted)]">{changeOrder.price_delta.notes}</p>
                    </div>
                     <div>
                        <h3 className="font-bold text-lg mb-2">Schedule Delta</h3>
                        <p>{changeOrder.schedule_delta}</p>
                    </div>
                </div>
            </Section>
        )}
    </>
);

  return (
    <div className="flex flex-col lg:flex-row h-full" style={proposalStyles}>
      {/* Mobile Top Navigation */}
      <nav className="lg:hidden print:hidden border-b border-[var(--line)] bg-[var(--bg-alt)]">
        <div className="p-2 flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={!generatedContent && (tab.id !== 'proposal' && tab.id !== 'changeorder')}
              className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--proposal-primary)]/10 text-[var(--proposal-primary)]'
                  : 'text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--fg)] disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 bg-[var(--bg-alt)] border-r border-[var(--line)] p-4 flex-col print:hidden">
        <h2 className="text-base font-bold mb-4 text-[var(--fg)] px-2">Navigation</h2>
        <nav className="flex flex-col space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={!generatedContent && (tab.id !== 'proposal' && tab.id !== 'changeorder')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-[var(--proposal-primary)]/10 text-[var(--proposal-primary)]'
                  : 'text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--fg)] disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-end mb-4 print:hidden">
              <button onClick={() => window.print()} className="btn-secondary">
                Print/PDF
              </button>
            </div>

            <div className="glass card p-6 sm:p-8 md:p-12 print:shadow-none print:border-none print:bg-white">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
                  <p className="mt-4 text-[var(--muted)]">Generating content...</p>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md">
                  <h3 className="font-bold">Error</h3>
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && (
                <>
                  {activeTab === 'proposal' && (!generatedContent ? <ContentPlaceholder title="Proposal Preview" message="Proposal content will appear here." /> : renderProposal())}
                  {activeTab === 'comparison' && (!packageComparison ? <ContentPlaceholder title="Package Comparison" message="AI-generated package comparison will appear here." /> : renderComparison())}
                  {activeTab === 'upsells' && (upsellSuggestions.length === 0 ? <ContentPlaceholder title="Suggested Upsells" message="AI-generated upsell suggestions will appear here." /> : renderUpsells())}
                  {activeTab === 'followups' && (followUpEmails.length === 0 ? <ContentPlaceholder title="Follow-up Emails" message="AI-generated follow-up email templates will appear here." /> : renderFollowUps())}
                  {activeTab === 'changeorder' && renderChangeOrder()}
                </>
              )}
            </div>
        </div>
        <div className="print-footer">
            <span>{formData.brand} | License #: {formData.license}</span>
            <span className="page-number"></span>
        </div>
      </div>
    </div>
  );
};

export default ProposalPreview;