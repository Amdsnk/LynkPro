import { Star } from 'lucide-react';

interface PerformanceRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PerformanceRating({ rating, onChange, readonly = false, size = 'md' }: PerformanceRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const handleClick = (star: number) => {
    if (!readonly && onChange) {
      onChange(star);
    }
  };
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? 'fill-primary text-primary' : 'text-muted'
          } ${!readonly && onChange ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => handleClick(star)}
        />
      ))}
    </div>
  );
}
