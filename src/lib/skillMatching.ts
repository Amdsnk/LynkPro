import { TaskAssignment, WorkerSkill, Profile } from '@/types/types';

export interface WorkerMatch {
  worker: Profile;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export function matchWorkersToTask(
  task: TaskAssignment,
  workers: Profile[],
  workerSkills: WorkerSkill[]
): WorkerMatch[] {
  const requiredSkills = task.required_skills || [];
  
  return workers.map((worker) => {
    const skills = workerSkills.filter(s => s.user_id === worker.id);
    let matchScore = 0;
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    
    requiredSkills.forEach((reqSkill) => {
      const workerSkill = skills.find(s => s.skill_name === reqSkill.skill_name);
      if (workerSkill) {
        const proficiencyScore = {
          beginner: 1,
          intermediate: 2,
          advanced: 3,
          expert: 4,
        };
        const reqScore = proficiencyScore[reqSkill.proficiency_level];
        const workerScore = proficiencyScore[workerSkill.proficiency_level];
        
        if (workerScore >= reqScore) {
          matchScore += workerScore;
          matchedSkills.push(reqSkill.skill_name);
        } else {
          missingSkills.push(`${reqSkill.skill_name} (needs ${reqSkill.proficiency_level}, has ${workerSkill.proficiency_level})`);
        }
      } else {
        missingSkills.push(reqSkill.skill_name);
      }
    });
    
    return { worker, matchScore, matchedSkills, missingSkills };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export function getSkillMatchPercentage(matchedSkills: number, totalRequired: number): number {
  if (totalRequired === 0) return 100;
  return Math.round((matchedSkills / totalRequired) * 100);
}
