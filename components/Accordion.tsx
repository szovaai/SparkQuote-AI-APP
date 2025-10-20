import React, { useState, useEffect } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  dataId: string;
}

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-transform duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false, dataId }) => {
  const storageKey = `spark-acc-${dataId}`;
  
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const savedState = localStorage.getItem(storageKey);
      return savedState !== null ? JSON.parse(savedState) : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  const toggleOpen = () => {
    setIsOpen((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <div className="border-b border-[var(--line)]">
      <button
        onClick={toggleOpen}
        className="w-full flex justify-between items-center py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="section-title">{title}</span>
        <span className={`text-[var(--muted)] transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pb-4 space-y-4">{children}</div>
      </div>
    </div>
  );
};

export default Accordion;