import { useState, useEffect, useCallback, useMemo } from 'react';
import { PaginatedResponse } from '../types';

export interface FetchParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface UseEntityListOptions<T> {
  fetchFn: (params: FetchParams) => Promise<PaginatedResponse<T>>;
  initialLimit?: number;
  autoFetch?: boolean;
  defaultFilters?: Record<string, unknown>;
  searchFields?: (keyof T)[];
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UseEntityListReturn<T> {
  data: T[];
  filteredData: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  search: string;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, unknown>;

  fetch: (params?: FetchParams) => Promise<void>;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSort: (sortBy: string | null, sortOrder?: 'asc' | 'desc') => void;
  setFilters: (filters: Record<string, unknown>) => void;
  clearFilters: () => void;
}

export function useEntityList<T extends object>(
  options: UseEntityListOptions<T>
): UseEntityListReturn<T> {
  const {
    fetchFn,
    initialLimit = 20,
    autoFetch = true,
    defaultFilters = {},
    searchFields = [],
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, unknown>>(defaultFilters);

  const fetch = useCallback(
    async (customParams?: FetchParams) => {
      setLoading(true);
      setError(null);

      try {
        const params: FetchParams = {
          page,
          limit,
          ...filters,
          ...defaultFilters,
          ...customParams,
        };

        if (search) params.search = search;
        if (sortBy) params.sortBy = sortBy;
        if (sortBy) params.sortOrder = sortOrder;

        const response = await fetchFn(params);

        setData(response.data || []);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 0);

        // Server may correct an out-of-range page; sync local state to response
        if (response.page && response.page !== page) {
          setPage(response.page);
        }
      } catch (err: unknown) {
        console.error('Fetch error:', err);

        let errorMessage = 'Failed to fetch data';
        if (err && typeof err === 'object') {
          const axiosError = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          errorMessage =
            axiosError.response?.data?.message ||
            axiosError.message ||
            errorMessage;
        }

        setError(errorMessage);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, page, limit, search, sortBy, sortOrder, filters, defaultFilters]
  );

  const refresh = useCallback(() => fetch(), [fetch]);

  const setSort = useCallback(
    (newSortBy: string | null, newSortOrder: 'asc' | 'desc' = 'asc') => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    []
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setSortBy(null);
    setSortOrder('asc');
    setFilters(defaultFilters);
    setPage(1);
  }, [defaultFilters]);

  const filteredData = useMemo(() => {
    if (!search.trim() || searchFields.length === 0) {
      return data;
    }

    const term = search.toLowerCase().trim();
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = (item as Record<string, unknown>)[field as string];
        if (value == null) return false;
        return String(value).toLowerCase().includes(term);
      })
    );
  }, [data, search, searchFields]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, sortOrder, JSON.stringify(filters)]);

  return {
    data,
    filteredData,
    loading,
    error,
    pagination: { page, limit, total, totalPages },
    search,
    sortBy,
    sortOrder,
    filters,
    fetch,
    refresh,
    setPage,
    setLimit,
    setSearch,
    setSort,
    setFilters,
    clearFilters,
  };
}

export default useEntityList;
