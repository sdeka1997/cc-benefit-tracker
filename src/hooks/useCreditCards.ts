import { useLocalStorage } from './useLocalStorage';
import type { CreditCard, Benefit, BenefitUsage, ResetFrequency, PeriodType } from '../types/index';
import { normalizeCard } from '../utils/migrationUtils';
import { getDisplayBenefitName } from '../utils/stringUtils';

export const useCreditCards = () => {
  const [storedCards, setStoredCards] = useLocalStorage<CreditCard[]>('cc-benefits', []);
  
  // Normalize data on every load
  const cards = storedCards.map(normalizeCard);

  const deleteCard = (cardId: string) => {
    if (confirm('Are you sure you want to delete this card and all its benefits?')) {
      setStoredCards(storedCards.filter(c => c.id !== cardId));
    }
  };

  const updateAnniversary = (cardId: string, newDate: string) => {
    setStoredCards(storedCards.map(card => {
      if (card.id === cardId) {
        return { ...card, anniversaryDate: new Date(newDate).toISOString(), isAnniversarySet: true };
      }
      return card;
    }));
  };

  const deleteAnniversary = (cardId: string) => {
    setStoredCards(storedCards.map(card => {
      if (card.id === cardId) {
        return { ...card, isAnniversarySet: false };
      }
      return card;
    }));
  };

  const syncCards = (updatedCards: CreditCard[]) => {
    setStoredCards(updatedCards);
  };

  const addUsage = (cardId: string, benefitId: string, amount: number, description: string, date: string) => {
    setStoredCards(storedCards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          benefits: card.benefits.map(benefit => {
            if (benefit.id === benefitId) {
              const newUsage: BenefitUsage = {
                id: crypto.randomUUID(),
                amount,
                date,
                description,
              };
              return {
                ...benefit,
                usedAmount: benefit.usedAmount + amount,
                usages: [...benefit.usages, newUsage]
              };
            }
            return benefit;
          })
        };
      }
      return card;
    }));
  };

  const deleteUsage = (cardId: string, benefitId: string, usageId: string) => {
    setStoredCards(storedCards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          benefits: card.benefits.map(benefit => {
            if (benefit.id === benefitId) {
              const usageToDelete = benefit.usages.find(u => u.id === usageId);
              const amountToSubtract = usageToDelete ? usageToDelete.amount : 0;
              return {
                ...benefit,
                usedAmount: benefit.usedAmount - amountToSubtract,
                usages: benefit.usages.filter(u => u.id !== usageId)
              };
            }
            return benefit;
          })
        };
      }
      return card;
    }));
  };

  const addBenefit = (
    cardId: string, 
    name: string, 
    amount: number, 
    frequency: ResetFrequency = 'annually', 
    periodType: PeriodType = 'calendar', 
    resetIntervalMonths?: number, 
    issueDate?: string
  ) => {
    setStoredCards(storedCards.map(card => {
      if (card.id === cardId) {
        const newBenefit: Benefit = {
          id: crypto.randomUUID(),
          name: getDisplayBenefitName(name),
          totalAmount: amount,
          usedAmount: 0,
          frequency,
          periodType,
          category: 'Other',
          usages: [],
          lastResetDate: new Date().toISOString(),
          resetIntervalMonths,
          issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
          unit: '$'
        };
        return { ...card, benefits: [...card.benefits, newBenefit] };
      }
      return card;
    }));
  };

  return {
    cards,
    deleteCard,
    updateAnniversary,
    deleteAnniversary,
    syncCards,
    addUsage,
    deleteUsage,
    addBenefit
  };
};
