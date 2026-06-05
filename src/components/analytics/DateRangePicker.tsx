import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateRangePreset = 'last7' | 'last30' | 'last90' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime' | 'custom';

interface DateRangePickerProps {
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null, preset: DateRangePreset) => void;
  selectedPreset: DateRangePreset;
}

export function DateRangePicker({ dateRange, onDateRangeChange, selectedPreset }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presets: Array<{ label: string; value: DateRangePreset }> = [
    { label: 'Last 7 Days', value: 'last7' },
    { label: 'Last 30 Days', value: 'last30' },
    { label: 'Last 90 Days', value: 'last90' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'All Time', value: 'allTime' },
  ];

  const getPresetRange = (preset: DateRangePreset): DateRange | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'last7':
        return {
          from: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
          to: today,
        };
      case 'last30':
        return {
          from: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
          to: today,
        };
      case 'last90':
        return {
          from: new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000),
          to: today,
        };
      case 'thisMonth':
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: today,
        };
      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          from: lastMonth,
          to: lastMonthEnd,
        };
      }
      case 'thisYear':
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: today,
        };
      case 'allTime':
        return null;
      default:
        return null;
    }
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    const range = getPresetRange(preset);
    onDateRangeChange(range, preset);
  };

  const handleCustomRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to }, 'custom');
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    onDateRangeChange(null, 'allTime');
  };

  const formatDateRange = () => {
    if (!dateRange) return 'All Time';
    if (selectedPreset !== 'custom') {
      const preset = presets.find(p => p.value === selectedPreset);
      return preset?.label || 'Custom Range';
    }
    return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={selectedPreset === preset.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick(preset.value)}
          className="transition-smooth"
        >
          {preset.label}
        </Button>
      ))}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedPreset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className="transition-smooth"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>

      {selectedPreset !== 'allTime' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="transition-smooth"
        >
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
      )}

      <div className="ml-auto text-sm text-muted-foreground">
        {formatDateRange()}
      </div>
    </div>
  );
}
