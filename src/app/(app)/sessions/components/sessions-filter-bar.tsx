'use client';

import { useQueryState, parseAsString, parseAsStringLiteral } from 'nuqs';
import { Hash } from 'lucide-react';

import {
  FilterToolbar,
  FilterToolbarActions,
  FilterSearch,
  FilterTabs,
  FilterSelect,
  FilterDateRange,
  FilterClearButton,
  type FilterTabOption,
  type FilterSelectOption,
} from '@/components/ui/filter-toolbar';

/** The only values `?status=` accepts; anything else falls back to `all`. */
const STATUS_VALUES = ['all', 'running', 'completed', 'paused', 'failed', 'cancelled'] as const;

type StatusValue = (typeof STATUS_VALUES)[number];

const STATUS_OPTIONS: readonly FilterTabOption<StatusValue>[] = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Done' },
  { value: 'paused', label: 'Paused' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface SessionsFilterBarProps {
  specs: Array<{ id: number; name: string }>;
}

export function SessionsFilterBar({ specs }: SessionsFilterBarProps) {
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({
      shallow: true,
      history: 'replace',
      throttleMs: 300,
    })
  );
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringLiteral(STATUS_VALUES)
      .withDefault('all')
      .withOptions({ shallow: true, history: 'replace' })
  );
  const [specId, setSpecId] = useQueryState(
    'specId',
    parseAsString.withDefault('all').withOptions({ shallow: true, history: 'replace' })
  );
  const [from, setFrom] = useQueryState(
    'from',
    parseAsString.withDefault('').withOptions({ shallow: true, history: 'replace' })
  );
  const [to, setTo] = useQueryState(
    'to',
    parseAsString.withDefault('').withOptions({ shallow: true, history: 'replace' })
  );

  const specOptions: FilterSelectOption[] = [
    { value: 'all', label: 'All specs' },
    ...specs.map((spec) => ({ value: String(spec.id), label: spec.name })),
  ];

  const isAnyFilterActive =
    search !== '' || status !== 'all' || specId !== 'all' || from !== '' || to !== '';

  const clearFilters = () => {
    setSearch(null);
    setStatus(null);
    setSpecId(null);
    setFrom(null);
    setTo(null);
  };

  return (
    <FilterToolbar>
      <FilterSearch
        value={search}
        onValueChange={(value) => setSearch(value || null)}
        placeholder="Search sessions…"
        label="Search sessions"
      />

      <FilterTabs
        value={status}
        onValueChange={(value) => setStatus(value === 'all' ? null : value)}
        options={STATUS_OPTIONS}
        label="Filter sessions by status"
      />

      <FilterToolbarActions>
        <FilterSelect
          value={specId}
          onValueChange={(value) => setSpecId(value === 'all' ? null : value)}
          options={specOptions}
          label="Filter by spec"
          icon={Hash}
        />
        <FilterDateRange
          from={from}
          to={to}
          onFromChange={(value) => setFrom(value || null)}
          onToChange={(value) => setTo(value || null)}
          label="Started between"
        />
        {isAnyFilterActive && <FilterClearButton onClear={clearFilters} />}
      </FilterToolbarActions>
    </FilterToolbar>
  );
}
