
import React, { useRef } from 'react';
import type { FormData, Quote, PackageTier, UpsellSuggestion } from '../types';
import { formatCurrency } from '../utils/quoteCalculator';
import SignaturePad from './SignaturePad';

interface ProposalPreviewProps {
  formData: FormData;
  quotes: { [key in PackageTier]?: Quote };
  generatedProposal: string;
  clientSignature: string;
  setClientSignature: (signature: string) => void;
  selectedPackage: PackageTier;
  setSelectedPackage: (tier: PackageTier) => void;
  isLoading: boolean;
  upsellSuggestions: UpsellSuggestion[] | null;
  onAddUpsell: (suggestion: UpsellSuggestion) => void;
  proposalNumber: number;
}

const ProposalHeader: React.FC<{ formData: FormData; proposalNumber: number }> = ({ formData, proposalNumber }) => {
    const currentYear = new Date().getFullYear();
    const formattedProposalNumber = `${formData.proposalNumberPrefix}-${currentYear}-${String(proposalNumber).padStart(4, '0')}`;
    
    return (
        <header className="flex justify-between items-start p-8 border-b border-[var(--line)]">
            <div>
                <h1 className="text-3xl font-bold text-[var(--fg)]">{formData.brand}</h1>
                {formData.license && <p className="text-sm text-[var(--muted)]">License #: {formData.license}</p>}
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-semibold text-[var(--fg)]">PROPOSAL</h2>
                <p className="text-sm text-[var(--muted)]">#{formattedProposalNumber}</p>
                <p className="text-sm text-[var(--muted)]">Date: {new Date().toLocaleDateString()}</p>
                <p className="text-sm text-[var(--muted)]">Valid for: {formData.validity} days</p>
            </div>
        </header>
    );
};

const ClientInfo: React.FC<{ formData: FormData }> = ({ formData }) => (
    <section className="p-8 grid grid-cols-2 gap-8">
        <div>
            <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Prepared For</h3>
            <p className="text-[var(--fg)] font-medium">{formData.clientType}</p>
            <p className="text-[var(--muted)]">{formData.siteAddress}</p>
        </div>
        <div>
            <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Project Summary</h3>
            <p className="text-[var(--muted)]">{formData.summary}</p>
        </div>
    </section>
);

const PackageSelector: React.FC<{
    selectedPackage: PackageTier;
    setSelectedPackage: (tier: PackageTier) => void;
    quotes: { [key in PackageTier]?: Quote };
}> = ({ selectedPackage, setSelectedPackage, quotes }) => {
    const packageTiers: PackageTier[] = ['good', 'better', 'best'];

    return (
        <div className="px-8 mb-6 print:hidden">
            <div className="flex border border-[var(--line)] rounded-lg overflow-hidden">
                {packageTiers.map(tier => {
                    const quote = quotes[tier];
                    const isSelected = selectedPackage === tier;
                    return (
                        <button
                            key={tier}
                            disabled={!quote}
                            onClick={() => setSelectedPackage(tier)}
                            className={`flex-1 p-4 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                ${isSelected ? 'bg-[var(--primary)] text-[var(--bg-alt)]' : 'bg-transparent text-[var(--muted)] hover:bg-[var(--line)]'}`}
                        >
                            <span className="block text-lg font-bold capitalize">{tier}</span>
                            {quote && <span className="block text-sm">{formatCurrency(quote.grandTotal, quote.currency)}</span>}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const QuoteDetails: React.FC<{ quote: Quote | undefined; }> = ({ quote }) => {
    if (!quote) {
        return <div className="p-8 text-[var(--muted)]">Select a package and generate the proposal to see quote details.</div>;
    }

    return (
        <section className="p-8">
            <table className="w-full text-left table-auto">
                <thead>
                    <tr className="text-[var(--muted)] text-sm border-b border-[var(--line)]">
                        <th className="p-3 font-semibold">Description</th>
                        <th className="p-3 font-semibold text-right">Qty</th>
                        <th className="p-3 font-semibold text-right">Rate</th>
                        <th className="p-3 font-semibold text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {quote.items.map((item, index) => (
                        <tr key={index} className="border-b border-[var(--line)]">
                            <td className="p-3 text-[var(--fg)]">{item.desc}</td>
                            <td className="p-3 text-right text-[var(--muted)]">{item.qty} {item.unit}</td>
                            <td className="p-3 text-right text-[var(--muted)]">{formatCurrency(item.rate, quote.currency)}</td>
                            <td className="p-3 text-right text-[var(--fg)]">{formatCurrency(item.amount, quote.currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mt-8">
                <div className="w-full max-w-sm">
                    <div className="flex justify-between py-2 border-b border-[var(--line)]">
                        <span className="text-[var(--muted)]">Material Subtotal</span>
                        <span className="font-medium text-[var(--fg)]">{formatCurrency(quote.totalMaterialCost, quote.currency)}</span>
                    </div>
                    {quote.markupAmount > 0 &&
                        <div className="flex justify-between py-2 border-b border-[var(--line)]">
                            <span className="text-[var(--muted)]">Markup ({quote.materialMarkupPercent}%)</span>
                            <span className="font-medium text-[var(--fg)]">{formatCurrency(quote.markupAmount, quote.currency)}</span>
                        </div>
                    }
                    <div className="flex justify-between py-2 border-b border-[var(--line)]">
                        <span className="text-[var(--muted)]">Labor Subtotal ({quote.totalHours} hrs @ {formatCurrency(quote.laborRate, quote.currency)}/hr)</span>
                        <span className="font-medium text-[var(--fg)]">{formatCurrency(quote.totalLaborCost, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-semibold">
                        <span className="text-[var(--fg)]">Subtotal</span>
                        <span className="text-[var(--fg)]">{formatCurrency(quote.subTotal, quote.currency)}</span>
                    </div>
                    {quote.discountAmount > 0 &&
                        <div className="flex justify-between py-2 text-[var(--success)]">
                            <span>Discount ({quote.discountPercent}%)</span>
                            <span>- {formatCurrency(quote.discountAmount, quote.currency)}</span>
                        </div>
                    }
                    <div className="flex justify-between py-2">
                        <span className="text-[var(--muted)]">Tax ({quote.taxPercent}%)</span>
                        <span className="font-medium text-[var(--fg)]">{formatCurrency(quote.taxAmount, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between py-3 bg-[var(--line)] px-4 rounded-md my-2">
                        <span className="text-xl font-bold text-[var(--secondary)]">Grand Total</span>
                        <span className="text-xl font-bold text-[var(--secondary)]">{formatCurrency(quote.grandTotal, quote.currency)}</span>
                    </div>
                    {quote.depositDue > 0 &&
                        <div className="flex justify-between py-2 text-[var(--fg)]">
                            <span>Deposit Due ({quote.depositPercent}%)</span>
                            <span className="font-semibold">{formatCurrency(quote.depositDue, quote.currency)}</span>
                        </div>
                    }
                </div>
            </div>
        </section>
    );
};

const ScopeAndTerms: React.FC<{ scope: string; terms: string; timeline: string; constraints: string; warranty: number; }> = ({ scope, terms, timeline, constraints, warranty }) => (
    <section className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Scope of Work</h3>
                <ul className="list-disc list-inside text-[var(--muted)] space-y-1">
                    {scope.split('\n').filter(line => line.trim()).map((line, i) => <li key={i}>{line.replace(/^- /, '')}</li>)}
                </ul>
            </div>
             <div>
                <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Timeline & Details</h3>
                 <p className="text-[var(--muted)] mb-2"><span className="font-semibold text-[var(--fg)]">Target:</span> {timeline}</p>
                 <p className="text-[var(--muted)]"><span className="font-semibold text-[var(--fg)]">Constraints:</span> {constraints}</p>
                 <p className="text-[var(--muted)] mt-2"><span className="font-semibold text-[var(--fg)]">Warranty:</span> {warranty} months</p>
            </div>
        </div>
        
        <div className="mt-8">
            <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Terms & Conditions</h3>
            {terms ? (
                <div className="prose prose-sm max-w-none text-[var(--muted)] whitespace-pre-wrap">{terms}</div>
            ) : (
                <div className="text-[var(--muted)] italic">Generate proposal to see terms and conditions.</div>
            )}
        </div>
    </section>
);

const UpsellSection: React.FC<{
  suggestions: UpsellSuggestion[] | null;
  onAddUpsell: (suggestion: UpsellSuggestion) => void;
}> = ({ suggestions, onAddUpsell }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <section className="px-8 pb-8 print:hidden">
      <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Recommended Add-ons</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map((item, index) => (
          <div key={index} className="bg-[var(--bg-alt)] border border-[var(--line)] rounded-lg p-4 flex flex-col">
            <h4 className="font-semibold text-[var(--fg)]">{item.name}</h4>
            <p className="text-[var(--muted)] text-sm mt-1 flex-grow">{item.description}</p>
            <button
              onClick={() => onAddUpsell(item)}
              className="mt-4 text-sm font-semibold text-[var(--primary)] hover:brightness-125 self-start"
            >
              + Add to Quote
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};


const AcceptanceSection: React.FC<{ clientSignature: string, setClientSignature: (sig: string) => void }> = ({ clientSignature, setClientSignature }) => {
    const sigPadRef = useRef<{ clear: () => void }>(null);

    const handleClear = () => {
        setClientSignature('');
        sigPadRef.current?.clear();
    };

    return (
        <section className="p-8 border-t border-[var(--line)] bg-[var(--bg-alt)]">
            <h3 className="text-lg font-bold text-[var(--fg)] mb-4">Acceptance</h3>
            <p className="text-sm text-[var(--muted)] mb-4">
                By signing below, you acknowledge that you have read, understood, and agree to the terms and conditions outlined in this proposal.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div>
                    <label htmlFor="signature-pad-canvas" className="block text-sm font-medium text-[var(--muted)] mb-1">Client Signature</label>
                    <div className="rounded-md border border-[var(--line)] overflow-hidden">
                        {clientSignature ? (
                            <img src={clientSignature} alt="Client Signature" className="w-full h-auto bg-[var(--bg)]" />
                        ) : (
                           <SignaturePad ref={sigPadRef} onSignatureEnd={setClientSignature} />
                        )}
                    </div>
                     <div className="flex justify-between items-center mt-2">
                        <input type="text" placeholder="Print Name" className="input text-sm !py-1.5 w-2/3" />
                        <button onClick={handleClear} className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">Clear</button>
                    </div>
                </div>
                 <div className="text-right">
                     <p className="text-sm text-[var(--muted)]">Date of Acceptance:</p>
                     <p className="font-semibold text-[var(--fg)]">{new Date().toLocaleDateString()}</p>
                 </div>
            </div>
        </section>
    );
}

const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  formData,
  quotes,
  generatedProposal,
  clientSignature,
  setClientSignature,
  selectedPackage,
  setSelectedPackage,
  isLoading,
  upsellSuggestions,
  onAddUpsell,
  proposalNumber
}) => {
  const proposalRef = useRef<HTMLDivElement>(null);
  const selectedPackageDetails = formData.packages[selectedPackage];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-[var(--bg)] border-b border-[var(--line)] flex justify-between items-center print:hidden">
            <h2 className="text-lg font-semibold text-[var(--fg)]">Proposal Preview</h2>
            <button onClick={handlePrint} className="btn-secondary">Print / Save as PDF</button>
        </div>
        <div className="flex-1 overflow-y-auto" ref={proposalRef}>
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
                        <p className="mt-4 text-[var(--muted)]">Generating your proposal...</p>
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto my-8 bg-[var(--bg)] shadow-lg border border-[var(--line)] rounded-lg print:shadow-none print:border-none print:my-0">
                    <ProposalHeader formData={formData} proposalNumber={proposalNumber} />
                    <ClientInfo formData={formData} />
                    <PackageSelector selectedPackage={selectedPackage} setSelectedPackage={setSelectedPackage} quotes={quotes} />
                    <QuoteDetails quote={quotes[selectedPackage]} />
                    <UpsellSection suggestions={upsellSuggestions} onAddUpsell={onAddUpsell} />
                    <ScopeAndTerms 
                        scope={selectedPackageDetails.scope}
                        terms={generatedProposal}
                        timeline={formData.timeline}
                        constraints={formData.constraints}
                        warranty={formData.warranty}
                    />
                    <AcceptanceSection clientSignature={clientSignature} setClientSignature={setClientSignature}/>
                </div>
            )}
        </div>
    </div>
  );
};

export default ProposalPreview;