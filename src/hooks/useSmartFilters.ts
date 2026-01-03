import { useState } from 'react';
import { NearbySale } from './useNearbySales';

export type CooldownPeriod = 3 | 7 | 14 | 30;

export interface SmartFilters {
  hideCompleted: boolean;
  cooldownDays: CooldownPeriod;
}

const defaultFilters: SmartFilters = {
  hideCompleted: false,
  cooldownDays: 7,
};

export function useSmartFilters() {
  const [filters, setFilters] = useState<SmartFilters>(defaultFilters);

  const updateFilter = <K extends keyof SmartFilters>(
    key: K,
    value: SmartFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  // No more date filtering - show all sales
  const filterSales = (sales: NearbySale[]): NearbySale[] => {
    return sales;
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    filterSales,
  };
}
