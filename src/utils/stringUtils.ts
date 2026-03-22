/**
 * Helper to clean card names for display by stripping the issuer 
 * and any text in parentheses.
 */
export const getDisplayCardName = (cardName: string, issuer: string) => {
  return cardName
    .replace(new RegExp(`^${issuer}\\s+`, 'i'), '')
    .replace(/\s*\(.*\)$/, '');
};

/**
 * Helper to clean benefit names for display by stripping leading 
 * redundant amounts and frequencies.
 */
export const getDisplayBenefitName = (name: string) => {
  if (name.toLowerCase().includes('companion award')) return name;

  return name
    .replace(/^(\$\d+(,\d+)*(\.\d+)?|\d+K?|\d+)\s+(Annual|Monthly|Quarterly|Semi-Annual|Calendar Year|Anniversary)\s+/i, '')
    .replace(/^(\$\d+(,\d+)*(\.\d+)?|(?!\b25K\b)\d+K?|\d+)\s+/i, '')
    .replace(/^(Annual|Monthly|Quarterly|Semi-Annual|Calendar Year|Anniversary)\s+/i, '')
    .replace(/\s*\(Q\)$/i, ''); // Strip trailing (Q)
};
