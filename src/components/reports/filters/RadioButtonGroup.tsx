import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface RadioOption {
  label: string;
  value: string;
}

interface RadioButtonGroupProps {
  label: string;
  options: RadioOption[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function RadioButtonGroup({
  label,
  options,
  selected,
  onChange,
  className = '',
}: RadioButtonGroupProps) {
  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <RadioGroup value={selected} onValueChange={onChange}>
        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label
                htmlFor={option.value}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
