import type { LineItem, Quote, FormData } from '../types';

export const parseMaterialLineItems = (itemsStr: string): Omit<LineItem, 'type'>[] => {
    return itemsStr.split('\n').map(line => {
      const [desc, qty, unit, rate] = line.split('|').map(s => s?.trim());
      if (!desc) return null;
      const quantity = Number(qty || 1);
      const itemRate = Number(rate || 0);
      return {
        desc,
        qty: quantity,
        unit: unit || 'ea',
        rate: itemRate,
        amount: quantity * itemRate
      };
    }).filter((item): item is LineItem => item !== null);
  };

export const parseLaborLineItems = (itemsStr: string, laborRate: number): { items: Omit<LineItem, 'type'>[], totalHours: number } => {
    let totalHours = 0;
    const items = itemsStr.split('\n').map(line => {
      const [desc, hours] = line.split('|').map(s => s?.trim());
      if (!desc) return null;
      const quantity = Number(hours || 1);
      totalHours += quantity;
      return {
        desc,
        qty: quantity,
        unit: 'hr',
        rate: laborRate,
        amount: quantity * laborRate
      };
    }).filter((item): item is LineItem => item !== null);
    return { items, totalHours };
};
  
export const calculateQuote = (
    materialLineItemsStr: string,
    laborLineItemsStr: string,
    data: Omit<FormData, 'packages'>
): Quote => {
    const materialItems = parseMaterialLineItems(materialLineItemsStr);
    const { items: laborItems, totalHours } = parseLaborLineItems(laborLineItemsStr, data.laborRate);

    const totalMaterialCost = materialItems.reduce((acc, item) => acc + item.amount, 0);
    const markupAmount = totalMaterialCost * (data.materialMarkupPercent / 100);
    const totalLaborCost = totalHours * data.laborRate;

    const subTotal = totalMaterialCost + markupAmount + totalLaborCost;
    
    const discountAmount = subTotal * (data.discount / 100);
    const taxedBase = subTotal - discountAmount;
    const taxAmount = taxedBase * (data.tax / 100);
    const grandTotal = taxedBase + taxAmount;
    const depositDue = grandTotal * (data.deposit / 100);
    const balanceAfterDeposit = grandTotal - depositDue;
    
    const allItems: LineItem[] = [
      ...materialItems.map(item => ({...item, type: 'material' as const})),
      ...laborItems.map(item => ({...item, type: 'labor' as const}))
    ];

    return {
        items: allItems,
        totalMaterialCost,
        markupAmount,
        totalLaborCost,
        totalHours,
        subTotal,
        discountAmount,
        taxAmount,
        grandTotal,
        depositDue,
        balanceAfterDeposit,
        currency: data.currency,
        materialMarkupPercent: data.materialMarkupPercent,
        laborRate: data.laborRate,
        taxPercent: data.tax,
        discountPercent: data.discount,
        depositPercent: data.deposit,
    };
};

export const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};
