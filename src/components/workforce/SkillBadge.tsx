import { Badge } from '@/components/ui/badge';
import { ProficiencyLevel } from '@/types/types';

interface SkillBadgeProps {
  proficiency: ProficiencyLevel;
  className?: string;
}

export function SkillBadge({ proficiency, className }: SkillBadgeProps) {
  const colors = {
    expert: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    advanced: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    beginner: 'bg-muted text-muted-foreground',
  };
  
  return (
    <Badge className={`${colors[proficiency]} ${className || ''}`} variant="secondary">
      {proficiency}
    </Badge>
  );
}
