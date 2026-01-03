import { useState } from 'react';
import { NearbySale } from './useNearbySales';

export type DateRange = '7d' | '30d' | '90d' | 'all' | 'custom';
export type PriceRange = 'any' | 'under500k' | '500k-1m' | 'over1m';
export type CooldownPeriod = 3 | 7 | 14 | 30;

// Keep FilterPreset for backward compatibility but it's no longer used
export type FilterPreset = 'recent' | 'smart-match' | 'high-value' | 'by-suburb';

export interface SmartFilters {
  preset: FilterPreset;
  dateRange: DateRange;
  priceRange: PriceRange;
  suburb: string | null;
  minBedrooms: number | null;
  excludeRecentlyContacted: boolean;
  customStartDate: Date | null;
  customEndDate: Date | null;
  searchQuery: string;
  hideCompleted: boolean;
  cooldownDays: CooldownPeriod;
}

const defaultFilters: SmartFilters = {
  preset: 'recent',
  dateRange: '30d',
  priceRange: 'any',
  suburb: null,
  minBedrooms: null,
  excludeRecentlyContacted: false,
  customStartDate: null,
  customEndDate: null,
  searchQuery: '',
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

  const getDateFilter = (): { start: Date | null; end: Date | null } => {
    const now = new Date();
    switch (filters.dateRange) {
      case '7d':
        return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: null };
      case '30d':
        return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: null };
      case '90d':
        return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: null };
      case 'custom':
        return { start: filters.customStartDate, end: filters.customEndDate };
      case 'all':
      default:
        return { start: null, end: null };
    }
  };

  const filterSales = (sales: NearbySale[]): NearbySale[] => {
    const dateFilter = getDateFilter();

    return sales.filter(sale => {
      // Date filter
      if (dateFilter.start && sale.sale_date) {
        const saleDate = new Date(sale.sale_date);
        if (saleDate < dateFilter.start) return false;
      }
      if (dateFilter.end && sale.sale_date) {
        const saleDate = new Date(sale.sale_date);
        if (saleDate > dateFilter.end) return false;
      }

      return true;
    });
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    filterSales,
    getDateFilter,
  };
}
