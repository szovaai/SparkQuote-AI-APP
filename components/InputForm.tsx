
import React, { useState } from 'react';
import type { FormData, PackageTier } from '../types';
import Accordion from './Accordion';
import { PRESETS } from '../data/presets';

interface InputFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onGenerate: () => void;
  isLoading: boolean;
  selectedTrade: string;
  setSelectedTrade: (trade: string) => void;
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  saveStatus: 'Saved' | 'Saving...' | 'Not Saved';
}

const SparkleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
        <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.291 3.118c.255.615.864 1.033 1.533 1.096l3.437.5c1.024.149 1.433 1.393.693 2.099l-2.488 2.426c-.47.458-.683 1.12-.544 1.76l.588 3.422c.177 1.028-.894 1.815-1.81 1.34l-3.073-1.616a1.99 1.99 0 0 0-1.82 0l-3.073 1.616c-.916.475-1.987-.312-1.81-1.34l.588-3.422c.14-.64-.073-1.302-.544-1.76L1.4 9.697c-.74-.706-.33-1.95.693-2.099l3.437-.5c.67-.097 1.278-.481 1.533-1.096l1.291-3.118Z" clipRule="evenodd" />
    </svg>
);

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[var(--muted)] cursor-help">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-[var(--bg-alt)] border border-[var(--line)] text-sm text-[var(--muted)] rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {text}
        </div>
    </div>
);

const InputField: React.FC<{id: string, name: string, label: string, placeholder?: string, type?: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void, children?: React.ReactNode, rows?: number, tooltip?: string}> = ({ id, name, label, placeholder, type = 'text', value, onChange, children, rows, tooltip }) => (
    <div>
        <div className="flex items-center justify-between mb-1">
            <label htmlFor={id} className="block text-sm font-medium text-[var(--muted)]">{label}</label>
            {tooltip && <Tooltip text={tooltip} />}
        </div>
        {type === 'textarea' ? (
            <textarea id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows || 4} className="input"/>
        ) : type === 'select' ? (
             <select id={id} name={name} value={value} onChange={onChange} className="input">
                {children}
            </select>
        ) : (
            <div className="relative">
                 <input id={id} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className={`input ${type === 'color' ? 'pr-12' : ''}`}/>
                 {type === 'color' && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <div className="w-6 h-6 rounded-md border border-[var(--line)]" style={{ backgroundColor: String(value) }}></div>
                    </div>
                )}
            </div>
        )}
    </div>
);


const InputForm: React.FC<InputFormProps> = ({ formData, setFormData, onGenerate, isLoading, selectedTrade, setSelectedTrade, selectedProject, setSelectedProject, saveStatus }) => {
  const [selectedPackage, setSelectedPackage] = useState<PackageTier>('better');
  const tradeOptions = Object.keys(PRESETS);
  const projectOptions = selectedTrade ? Object.keys(PRESETS[selectedTrade]?.jobs || {}) : [];


  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'trade') {
        setSelectedTrade(value);
        const firstProject = Object.keys(PRESETS[value].jobs)[0];
        setSelectedProject(firstProject);
        return;
    }
    if (name === 'title') {
        setSelectedProject(value);
        return;
    }

    const isNumber = type === 'number';
    setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
  };

  const handlePackageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        packages: {
            ...prev.packages,
            [selectedPackage]: {
                ...prev.packages[selectedPackage],
                [name]: value,
            }
        }
    }));
  };

  const packageTiers: PackageTier[] = ['good', 'better', 'best'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto pr-2">
        
        <Accordion title="Job Details" defaultOpen>
            <InputField id="trade" name="trade" label="Trade" type="select" value={selectedTrade} onChange={handleGeneralChange} tooltip="Select the primary trade for this job, like Electrical or Plumbing.">
                {tradeOptions.map(trade => <option key={trade} value={trade}>{trade}</option>)}
            </InputField>
            <InputField id="title" name="title" label="Project Title" type="select" value={selectedProject} onChange={handleGeneralChange} tooltip="Choose a preset project to quickly fill out the proposal details.">
                {projectOptions.map(project => <option key={project} value={project}>{project}</option>)}
            </InputField>
            <InputField id="siteAddress" name="siteAddress" label="Site Address" placeholder="e.g., 123 Main St, Toronto, ON" value={formData.siteAddress} onChange={handleGeneralChange} tooltip="Enter the full address where the work will be performed."/>
            <InputField id="clientType" name="clientType" label="Client Type" type="select" value={formData.clientType} onChange={handleGeneralChange} tooltip="Select the type of client, e.g., Homeowner or Commercial.">
                <option value="Homeowner">Homeowner</option>
                <option value="Commercial">Commercial</option>
                <option value="Business Partner">Business Partner</option>
                <option value="Subcontractor">Subcontractor</option>
            </InputField>
        </Accordion>

        <Accordion title="Scope & Pricing" defaultOpen>
            <InputField id="summary" name="summary" label="Job Summary" placeholder="Briefly describe the project." value={formData.summary} onChange={handleGeneralChange} type="textarea" rows={3} tooltip="Provide a brief, high-level summary for the AI to understand the project's goals."/>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <InputField id="materialMarkupPercent" name="materialMarkupPercent" label="Material Markup %" type="number" value={formData.materialMarkupPercent} onChange={handleGeneralChange} tooltip="The percentage added to the total material cost for profit."/>
                <InputField id="laborRate" name="laborRate" label="Labor Rate ($/hr)" type="number" value={formData.laborRate} onChange={handleGeneralChange} tooltip="Your standard hourly rate for labor on this project."/>
            </div>

            <div className="my-4">
                 <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--muted)]">Packages</label>
                    <Tooltip text="Switch between Good, Better, and Best options to edit their scope and pricing." />
                </div>
                <div className="grid grid-cols-3 gap-1 bg-[var(--bg)] p-1 rounded-lg border border-[var(--line)]">
                    {packageTiers.map(tier => (
                        <button
                            key={tier}
                            onClick={() => setSelectedPackage(tier)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md capitalize transition-colors ${selectedPackage === tier ? 'bg-[var(--primary)] text-[var(--bg)]' : 'bg-transparent text-[var(--muted)] hover:bg-[var(--line)]'}`}
                        >
                            {tier}
                        </button>
                    ))}
                </div>
            </div>

            <InputField id="scope" name="scope" label={`Scope for "${selectedPackage}" package`} placeholder="- Detail 1&#10;- Detail 2" value={formData.packages[selectedPackage].scope} onChange={handlePackageChange} type="textarea" rows={4} tooltip="List the key deliverables for this package, with one item per line."/>
            <InputField id="materialLineItems" name="materialLineItems" label={`Materials & Services for "${selectedPackage}"`} placeholder="Material Description | 1 | ea | 100" value={formData.packages[selectedPackage].materialLineItems} onChange={handlePackageChange} type="textarea" rows={5} tooltip="List materials and services in the format: Description | Qty | Unit | Cost."/>
            <InputField id="laborLineItems" name="laborLineItems" label={`Labor for "${selectedPackage}"`} placeholder="Labor Task | 8 | hrs" value={formData.packages[selectedPackage].laborLineItems} onChange={handlePackageChange} type="textarea" rows={3} tooltip="List labor tasks in the format: Description | Hours."/>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <InputField id="tax" name="tax" label="Tax %" type="number" value={formData.tax} onChange={handleGeneralChange} tooltip="The sales tax percentage to be applied to the subtotal."/>
                <InputField id="discount" name="discount" label="Discount %" type="number" value={formData.discount} onChange={handleGeneralChange} tooltip="An optional discount percentage to apply before tax."/>
                <InputField id="deposit" name="deposit" label="Deposit %" type="number" value={formData.deposit} onChange={handleGeneralChange} tooltip="The percentage of the grand total required upfront to begin work."/>
            </div>
             <InputField id="currency" name="currency" label="Currency" placeholder="e.g., USD, CAD" value={formData.currency} onChange={handleGeneralChange} tooltip="The currency for all financial values in the proposal."/>
        </Accordion>
        
        <Accordion title="Terms & Schedule">
             <InputField id="constraints" name="constraints" label="Constraints" placeholder="e.g., Work hours, site access" value={formData.constraints} onChange={handleGeneralChange} type="textarea" rows={2} tooltip="Note any site access issues, work hours, or other limitations."/>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <InputField id="warranty" name="warranty" label="Warranty (Months)" type="number" value={formData.warranty} onChange={handleGeneralChange} tooltip="The length of your workmanship warranty in months."/>
                 <InputField id="validity" name="validity" label="Validity (Days)" type="number" value={formData.validity} onChange={handleGeneralChange} tooltip="The number of days this proposal remains valid before expiring."/>
            </div>
            <InputField id="timeline" name="timeline" label="Timeline Target" placeholder="e.g., 5-7 business days" value={formData.timeline} onChange={handleGeneralChange} tooltip="Provide an estimated completion time for the project."/>
        </Accordion>
        
        <Accordion title="Branding">
            <InputField id="brand" name="brand" label="Company Name" placeholder="Your Company LLC" value={formData.brand} onChange={handleGeneralChange} tooltip="Your official company name as it should appear on the proposal."/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField id="license" name="license" label="License #" placeholder="Your License Number" value={formData.license} onChange={handleGeneralChange} tooltip="Your official trade license number, if applicable."/>
                <InputField id="proposalNumberPrefix" name="proposalNumberPrefix" label="Proposal # Prefix" placeholder="e.g., INV" value={formData.proposalNumberPrefix} onChange={handleGeneralChange} tooltip="The prefix for your automatically generated proposal numbers (e.g., TPS)."/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <InputField id="primaryColor" name="primaryColor" label="Primary Color" type="color" value={formData.primaryColor} onChange={handleGeneralChange} tooltip="The main accent color for proposal headings and highlights."/>
                <InputField id="secondaryColor" name="secondaryColor" label="Secondary Color" type="color" value={formData.secondaryColor} onChange={handleGeneralChange} tooltip="A secondary accent color, used for less prominent details."/>
            </div>
        </Accordion>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--line)]">
        <button onClick={onGenerate} disabled={isLoading} className="w-full btn-primary">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
          ) : (
            <><SparkleIcon /> Generate Invoice</>
          )}
        </button>
        <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-[var(--muted)]">Note: Terms are generic guidelines.</p>
            <p className="text-xs text-[var(--muted)] transition-opacity">
                {saveStatus === 'Saving...' ? '💾 Saving...' : `💾 ${saveStatus}`}
            </p>
        </div>
      </div>
    </div>
  );
};

export default InputForm;
