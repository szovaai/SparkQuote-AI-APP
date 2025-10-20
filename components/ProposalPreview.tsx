import React, { useState, useRef } from 'react';
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
  quotes: { [key in PackageTier]?: Quote };
  generatedContent: GeneratedContent | null;
  upsellSuggestions: UpsellSuggestion[];
  packageComparison: PackageComparison | null;
  followUpEmails: FollowUpEmail[];
  changeOrder: ChangeOrder | null;
  onGenerateChangeOrder: (changeRequest: string) => void;
  isLoading: boolean;
  error: string | null;
}

type Tab = 'proposal' | 'comparison' | 'upsells' | 'followups' | 'changeorder';

// Icon Components for Sidebar Navigation
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
const ScaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c-1.472 0-2.882.265-4.185.75M12 12.75h.008v.008H12v-.008Z" /></svg>;
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;

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
  quotes,
  generatedContent,
  upsellSuggestions,
  packageComparison,
  followUpEmails,
  changeOrder,
  onGenerateChangeOrder,
  isLoading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('proposal');
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [changeRequest, setChangeRequest] = useState('');
  const signaturePadRef = useRef<{ clear: () => void }>(null);

  const { primaryColor, secondaryColor } = formData;
  const proposalStyles = {
    '--proposal-primary': primaryColor || 'var(--primary)',
    '--proposal-secondary': secondaryColor || 'var(--secondary)',
  } as React.CSSProperties;

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

  const renderProposal = () => (
    <>
      <header className="flex flex-col sm:flex-row justify-between items-start mb-12 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{formData.brand}</h1>
          <p className="text-[var(--muted)]">License #: {formData.license}</p>
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
        </div>
      </header>

      <Section title="Cover Letter">{generatedContent!.cover_letter}</Section>
      <Section title="Scope of Work">
        <ul>
          {generatedContent!.scope_of_work.map((item, i) => (
            <li key={i}>{item}</li>
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
      <Section title="Investment">
        {quotes.better ? (
          <div>
            <LineItemsTable
              items={quotes.better.items}
              currency={quotes.better.currency}
            />
            <QuoteTotals quote={quotes.better} />
          </div>
        ) : (
          <p>Pricing details not available.</p>
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
        <div className="mt-4 border border-[var(--line)] rounded-md p-4">
            <SignaturePad ref={signaturePadRef} onSignatureEnd={setSignatureDataUrl} />
            <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-[var(--muted)]">Sign above</p>
                <button onClick={() => signaturePadRef.current?.clear()} className="btn-secondary text-xs">Clear</button>
            </div>
        </div>
        {signatureDataUrl && <img src={signatureDataUrl} alt="Signature" className="h-20 mt-2 bg-white rounded" />}
      </Section>
    </>
  );

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
        <div className="space-y-4">
            {upsellSuggestions.map((item, i) => (
                <div key={i} className="p-4 border border-[var(--line)] rounded-md bg-[var(--bg)]">
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm my-1 text-[var(--muted)]">{item.why_it_matters}</p>
                    <div className="mt-2 pt-2 border-t border-[var(--line)] text-xs font-mono text-cyan-400">
                        {item.line_item}
                    </div>
                </div>
            ))}
        </div>
    </Section>
  );

  const renderFollowUps = () => (
    <Section title="Follow-up Email Templates">
        <div className="space-y-4">
            {followUpEmails.map((email, i) => (
                <div key={i} className="p-4 border border-[var(--line)] rounded-md bg-[var(--bg)]">
                    <h3 className="font-semibold">Subject: {email.subject}</h3>
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

            <div className="max-w-4xl mx-auto my-8 print:my-0 bg-[var(--bg-alt)] print:bg-white shadow-lg print:shadow-none rounded-lg p-6 sm:p-8 md:p-12 print:border-none border border-[var(--line)]">
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
      </div>
    </div>
  );
};

export default ProposalPreview;