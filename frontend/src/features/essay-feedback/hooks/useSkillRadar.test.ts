/**
 * useSkillRadar Hook Tests
 *
 * Tests for the skill radar data management hook covering:
 * - Chart data transformation
 * - Top/bottom skill calculation
 * - Average score calculation
 * - Mastery level determination
 * - Comparison mode detection
 * - Edge cases (empty data, extreme values)
 *
 * Run with: pnpm exec vitest run src/features/essay-feedback/hooks/useSkillRadar.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSkillRadar } from './useSkillRadar';

const defaultSkills = {
  grammar: 85,
  logic: 72,
  tone: 90,
  structure: 78,
  vocabulary: 88
};

const averageSkills = {
  grammar: 75,
  logic: 70,
  tone: 80,
  structure: 72,
  vocabulary: 78
};

describe('useSkillRadar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chart Data Transformation', () => {
    it('transforms skills object to chart data array', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(result.current.chartData).toHaveLength(5);
      expect(result.current.chartData[0]).toHaveProperty('skill');
      expect(result.current.chartData[0]).toHaveProperty('score');
      expect(result.current.chartData[0]).toHaveProperty('fullMark', 100);
    });

    it('uses correct skill labels', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      const skillNames = result.current.chartData.map((item) => item.skill);

      expect(skillNames).toEqual([
        'Grammar',
        'Logic',
        'Tone',
        'Structure',
        'Vocabulary'
      ]);
    });

    it('preserves skill scores correctly', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      const scoresByName = result.current.chartData.reduce(
        (acc, item) => {
          acc[item.skill] = item.score;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(scoresByName.Grammar).toBe(85);
      expect(scoresByName.Logic).toBe(72);
      expect(scoresByName.Tone).toBe(90);
      expect(scoresByName.Structure).toBe(78);
      expect(scoresByName.Vocabulary).toBe(88);
    });

    it('clamps scores above 100 to 100', () => {
      const invalidSkills = {
        grammar: 120,
        logic: 150,
        tone: 100,
        structure: 99,
        vocabulary: 101
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: invalidSkills })
      );

      const scores = result.current.chartData.map((item) => item.score);

      expect(scores).toEqual([100, 100, 100, 99, 100]);
    });

    it('clamps scores below 0 to 0', () => {
      const invalidSkills = {
        grammar: -10,
        logic: -5,
        tone: 0,
        structure: 5,
        vocabulary: -100
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: invalidSkills })
      );

      const scores = result.current.chartData.map((item) => item.score);

      expect(scores).toEqual([0, 0, 0, 5, 0]);
    });
  });

  describe('Comparison Mode', () => {
    it('returns hasComparison=false when averageSkills is not provided', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(result.current.hasComparison).toBe(false);
    });

    it('returns hasComparison=true when averageSkills is provided', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills, averageSkills })
      );

      expect(result.current.hasComparison).toBe(true);
    });

    it('returns hasComparison=false when averageSkills is null', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills, averageSkills: null as any })
      );

      expect(result.current.hasComparison).toBe(false);
    });

    it('returns hasComparison=false when averageSkills is undefined', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills, averageSkills: undefined })
      );

      expect(result.current.hasComparison).toBe(false);
    });
  });

  describe('Top Skill Calculation', () => {
    it('identifies highest scoring skill', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(result.current.topSkill).toEqual({
        name: 'Tone',
        score: 90
      });
    });

    it('handles tie for highest score (returns first)', () => {
      const tiedSkills = {
        grammar: 90,
        logic: 72,
        tone: 90,
        structure: 78,
        vocabulary: 88
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: tiedSkills })
      );

      expect(result.current.topSkill).toEqual({
        name: 'Grammar',
        score: 90
      });
    });

    it('returns null when no skills provided', () => {
      const emptySkills = {
        grammar: 0,
        logic: 0,
        tone: 0,
        structure: 0,
        vocabulary: 0
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: emptySkills })
      );

      // Should still return a skill even if all are 0
      expect(result.current.topSkill).toBeTruthy();
    });
  });

  describe('Bottom Skill Calculation', () => {
    it('identifies lowest scoring skill', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(result.current.bottomSkill).toEqual({
        name: 'Logic',
        score: 72
      });
    });

    it('handles tie for lowest score (returns first)', () => {
      const tiedSkills = {
        grammar: 72,
        logic: 72,
        tone: 90,
        structure: 78,
        vocabulary: 88
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: tiedSkills })
      );

      expect(result.current.bottomSkill).toEqual({
        name: 'Grammar',
        score: 72
      });
    });

    it('returns a skill even when all scores are equal', () => {
      const equalSkills = {
        grammar: 75,
        logic: 75,
        tone: 75,
        structure: 75,
        vocabulary: 75
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: equalSkills })
      );

      expect(result.current.bottomSkill).toEqual({
        name: 'Grammar',
        score: 75
      });
    });
  });

  describe('Average Score Calculation', () => {
    it('calculates correct average score', () => {
      // (85 + 72 + 90 + 78 + 88) / 5 = 413 / 5 = 82.6 -> 83
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(result.current.averageScore).toBe(83);
    });

    it('rounds average correctly', () => {
      const skills = {
        grammar: 80,
        logic: 81,
        tone: 82,
        structure: 83,
        vocabulary: 84
      };

      // (80 + 81 + 82 + 83 + 84) / 5 = 410 / 5 = 82
      const { result } = renderHook(() => useSkillRadar({ skills }));

      expect(result.current.averageScore).toBe(82);
    });

    it('handles all zero scores', () => {
      const zeroSkills = {
        grammar: 0,
        logic: 0,
        tone: 0,
        structure: 0,
        vocabulary: 0
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: zeroSkills })
      );

      expect(result.current.averageScore).toBe(0);
    });

    it('handles all perfect scores', () => {
      const perfectSkills = {
        grammar: 100,
        logic: 100,
        tone: 100,
        structure: 100,
        vocabulary: 100
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: perfectSkills })
      );

      expect(result.current.averageScore).toBe(100);
    });
  });

  describe('Mastery Level Determination', () => {
    it('returns "Expert" for average >= 90', () => {
      const expertSkills = {
        grammar: 92,
        logic: 90,
        tone: 95,
        structure: 91,
        vocabulary: 93
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: expertSkills })
      );

      expect(result.current.masteryLevel).toBe('Expert');
    });

    it('returns "Advanced" for average >= 75 and < 90', () => {
      const advancedSkills = {
        grammar: 78,
        logic: 76,
        tone: 80,
        structure: 75,
        vocabulary: 82
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: advancedSkills })
      );

      expect(result.current.masteryLevel).toBe('Advanced');
    });

    it('returns "Proficient" for average >= 60 and < 75', () => {
      const proficientSkills = {
        grammar: 65,
        logic: 62,
        tone: 70,
        structure: 60,
        vocabulary: 68
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: proficientSkills })
      );

      expect(result.current.masteryLevel).toBe('Proficient');
    });

    it('returns "Developing" for average >= 40 and < 60', () => {
      const developingSkills = {
        grammar: 45,
        logic: 50,
        tone: 55,
        structure: 40,
        vocabulary: 50
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: developingSkills })
      );

      expect(result.current.masteryLevel).toBe('Developing');
    });

    it('returns "Beginner" for average < 40', () => {
      const beginnerSkills = {
        grammar: 30,
        logic: 35,
        tone: 25,
        structure: 38,
        vocabulary: 32
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: beginnerSkills })
      );

      expect(result.current.masteryLevel).toBe('Beginner');
    });

    it('handles boundary at exactly 90 (Expert)', () => {
      const boundarySkills = {
        grammar: 90,
        logic: 90,
        tone: 90,
        structure: 90,
        vocabulary: 90
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: boundarySkills })
      );

      expect(result.current.masteryLevel).toBe('Expert');
    });

    it('handles boundary at exactly 75 (Advanced)', () => {
      const boundarySkills = {
        grammar: 75,
        logic: 75,
        tone: 75,
        structure: 75,
        vocabulary: 75
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: boundarySkills })
      );

      expect(result.current.masteryLevel).toBe('Advanced');
    });

    it('handles boundary at exactly 60 (Proficient)', () => {
      const boundarySkills = {
        grammar: 60,
        logic: 60,
        tone: 60,
        structure: 60,
        vocabulary: 60
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: boundarySkills })
      );

      expect(result.current.masteryLevel).toBe('Proficient');
    });

    it('handles boundary at exactly 40 (Developing)', () => {
      const boundarySkills = {
        grammar: 40,
        logic: 40,
        tone: 40,
        structure: 40,
        vocabulary: 40
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: boundarySkills })
      );

      expect(result.current.masteryLevel).toBe('Developing');
    });
  });

  describe('Edge Cases', () => {
    it('handles single non-zero score', () => {
      const singleScoreSkills = {
        grammar: 100,
        logic: 0,
        tone: 0,
        structure: 0,
        vocabulary: 0
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: singleScoreSkills })
      );

      expect(result.current.topSkill).toEqual({ name: 'Grammar', score: 100 });
      expect(result.current.bottomSkill).toEqual({ name: 'Logic', score: 0 });
      expect(result.current.averageScore).toBe(20);
      expect(result.current.masteryLevel).toBe('Beginner');
    });

    it('handles large score differences', () => {
      const variedSkills = {
        grammar: 100,
        logic: 20,
        tone: 80,
        structure: 40,
        vocabulary: 60
      };

      const { result } = renderHook(() =>
        useSkillRadar({ skills: variedSkills })
      );

      expect(result.current.topSkill).toEqual({ name: 'Grammar', score: 100 });
      expect(result.current.bottomSkill).toEqual({ name: 'Logic', score: 20 });
      expect(result.current.averageScore).toBe(60);
      expect(result.current.masteryLevel).toBe('Proficient');
    });
  });

  describe('Return Object Structure', () => {
    it('returns all required properties', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(result.current).toHaveProperty('chartData');
      expect(result.current).toHaveProperty('hasComparison');
      expect(result.current).toHaveProperty('topSkill');
      expect(result.current).toHaveProperty('bottomSkill');
      expect(result.current).toHaveProperty('averageScore');
      expect(result.current).toHaveProperty('masteryLevel');
    });

    it('returns chartData as array', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(Array.isArray(result.current.chartData)).toBe(true);
    });

    it('returns hasComparison as boolean', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(typeof result.current.hasComparison).toBe('boolean');
    });

    it('returns averageScore as number', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(typeof result.current.averageScore).toBe('number');
    });

    it('returns masteryLevel as string', () => {
      const { result } = renderHook(() =>
        useSkillRadar({ skills: defaultSkills })
      );

      expect(typeof result.current.masteryLevel).toBe('string');
    });
  });
});
