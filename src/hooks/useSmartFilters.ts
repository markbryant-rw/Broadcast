import { useState, useMemo } from 'react';
import { NearbySale } from './useNearbySales';

export type FilterPreset = 'recent' | 'smart-match' | 'high-value' | 'by-suburb';
export type DateRange = '7d' | '30d' | '90d' | 'all' | 'custom';
export type PriceRange = 'any' | 'under500k' | '500k-1m' | 'over1m';

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

  const setPreset = (preset: FilterPreset) => {
    switch (preset) {
      case 'recent':
        setFilters({
          ...defaultFilters,
          preset: 'recent',
          dateRange: '30d',
        });
        break;
      case 'smart-match':
        setFilters({
          ...defaultFilters,
          preset: 'smart-match',
          dateRange: '30d',
          excludeRecentlyContacted: false, // We show all but highlight not contacted
        });
        break;
      case 'high-value':
        setFilters({
          ...defaultFilters,
          preset: 'high-value',
          priceRange: 'over1m',
          dateRange: '30d',
        });
        break;
      case 'by-suburb':
        setFilters({
          ...defaultFilters,
          preset: 'by-suburb',
        });
        break;
    }
  };

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

  const getPriceFilter = (): { min: number | null; max: number | null } => {
    switch (filters.priceRange) {
      case 'under500k':
        return { min: null, max: 500000 };
      case '500k-1m':
        return { min: 500000, max: 1000000 };
      case 'over1m':
        return { min: 1000000, max: null };
      case 'any':
      default:
        return { min: null, max: null };
    }
  };

  const filterSales = (sales: NearbySale[]): NearbySale[] => {
    const dateFilter = getDateFilter();
    const priceFilter = getPriceFilter();

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

      // Price filter
      if (priceFilter.min && (sale.sale_price ?? 0) < priceFilter.min) return false;
      if (priceFilter.max && (sale.sale_price ?? 0) > priceFilter.max) return false;

      // Suburb filter
      if (filters.suburb && sale.suburb.toLowerCase() !== filters.suburb.toLowerCase()) {
        return false;
      }

      // Bedrooms filter
      if (filters.minBedrooms && (sale.bedrooms ?? 0) < filters.minBedrooms) {
        return false;
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchAddress = sale.address.toLowerCase().includes(query);
        const matchSuburb = sale.suburb.toLowerCase().includes(query);
        if (!matchAddress && !matchSuburb) return false;
      }

      return true;
    });
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    setPreset,
    filterSales,
    getDateFilter,
    getPriceFilter,
  };
}
