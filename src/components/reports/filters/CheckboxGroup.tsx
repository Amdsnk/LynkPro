import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxOption {
  label: string;
  value: string;
}

interface CheckboxGroupProps {
  label: string;
  options: CheckboxOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export default function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
  className = '',
}: CheckboxGroupProps) {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(opt => opt.value));
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{label}</label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-primary hover:underline"
        >
          {selected.length === options.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
            />
            <Label
              htmlFor={option.value}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
