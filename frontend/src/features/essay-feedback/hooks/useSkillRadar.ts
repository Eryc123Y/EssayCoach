'use client';

import * as React from 'react';
import { SkillData } from '../components/skill-radar-chart';

export interface UseSkillRadarOptions {
  /** 原始技能分数 (0-100) */
  skills: {
    grammar: number;
    logic: number;
    tone: number;
    structure: number;
    vocabulary: number;
  };
  /** 对比数据（可选）- 班级平均分 */
  averageSkills?: {
    grammar: number;
    logic: number;
    tone: number;
    structure: number;
    vocabulary: number;
  };
}

export interface UseSkillRadarReturn {
  /** 雷达图数据（Recharts 格式） */
  chartData: SkillData[];
  /** 是否有对比数据 */
  hasComparison: boolean;
  /** 最高分项 */
  topSkill: { name: string; score: number } | null;
  /** 最低分项 */
  bottomSkill: { name: string; score: number } | null;
  /** 平均分 */
  averageScore: number;
  /** 技能掌握等级 */
  masteryLevel:
    | 'Beginner'
    | 'Developing'
    | 'Proficient'
    | 'Advanced'
    | 'Expert';
}

const SKILL_LABELS: Record<
  keyof Required<UseSkillRadarOptions>['skills'],
  string
> = {
  grammar: 'Grammar',
  logic: 'Logic',
  tone: 'Tone',
  structure: 'Structure',
  vocabulary: 'Vocabulary'
};

/**
 * Hook for managing skill radar chart data and computations
 *
 * @example
 * ```tsx
 * const { chartData, topSkill, averageScore, masteryLevel } = useSkillRadar({
 *   skills: { grammar: 85, logic: 72, tone: 90, structure: 78, vocabulary: 88 }
 * });
 * ```
 */
export function useSkillRadar(
  options: UseSkillRadarOptions
): UseSkillRadarReturn {
  const { skills, averageSkills } = options;

  // Compute chart data for Recharts
  const chartData = React.useMemo<SkillData[]>(() => {
    return (Object.keys(skills) as Array<keyof typeof skills>).map((key) => ({
      skill: SKILL_LABELS[key],
      score: Math.max(0, Math.min(100, skills[key])), // Clamp to 0-100
      fullMark: 100
    }));
  }, [skills]);

  // Check if comparison data exists
  const hasComparison = React.useMemo(() => {
    return (
      averageSkills !== undefined &&
      averageSkills !== null &&
      Object.values(averageSkills).some((v) => v !== undefined)
    );
  }, [averageSkills]);

  // Find top skill
  const topSkill = React.useMemo<{ name: string; score: number } | null>(() => {
    if (chartData.length === 0) return null;

    let max = chartData[0];
    for (const item of chartData) {
      if (item.score > max.score) {
        max = item;
      }
    }
    return { name: max.skill, score: max.score };
  }, [chartData]);

  // Find bottom skill
  const bottomSkill = React.useMemo<{
    name: string;
    score: number;
  } | null>(() => {
    if (chartData.length === 0) return null;

    let min = chartData[0];
    for (const item of chartData) {
      if (item.score < min.score) {
        min = item;
      }
    }
    return { name: min.skill, score: min.score };
  }, [chartData]);

  // Calculate average score
  const averageScore = React.useMemo(() => {
    if (chartData.length === 0) return 0;

    const sum = chartData.reduce((acc, item) => acc + item.score, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  // Determine mastery level based on average score
  const masteryLevel = React.useMemo<
    UseSkillRadarReturn['masteryLevel']
  >(() => {
    if (averageScore >= 90) return 'Expert';
    if (averageScore >= 75) return 'Advanced';
    if (averageScore >= 60) return 'Proficient';
    if (averageScore >= 40) return 'Developing';
    return 'Beginner';
  }, [averageScore]);

  return {
    chartData,
    hasComparison,
    topSkill,
    bottomSkill,
    averageScore,
    masteryLevel
  };
}
