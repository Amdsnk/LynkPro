/**
 * Filter metadata interface for export functionality
 */
export interface FilterMetadata {
  reportType: string;
  reportTitle: string;
  exportTimestamp: string;
  presetName?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  selectedProjects?: string[];
  selectedCategories?: {
    label: string;
    values: string[];
  };
  selectedStatus?: {
    label: string;
    value: string;
  };
  additionalFilters?: Record<string, string | string[]>;
}
