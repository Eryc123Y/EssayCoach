export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UseRevisionChatOptions {
  onSendMessage?: (message: string) => Promise<string>;
  initialMessages?: ChatMessage[];
}

export interface SkillScores {
  /** 语法分数 (0-100) */
  grammar: number;
  /** 逻辑分数 (0-100) */
  logic: number;
  /** 语气分数 (0-100) */
  tone: number;
  /** 结构分数 (0-100) */
  structure: number;
  /** 词汇分数 (0-100) */
  vocabulary: number;
}

export interface SkillRadarData {
  chartData: Array<{
    skill: string;
    score: number;
    fullMark: number;
  }>;
  hasComparison: boolean;
  topSkill: { name: string; score: number } | null;
  bottomSkill: { name: string; score: number } | null;
  averageScore: number;
  masteryLevel:
    | 'Beginner'
    | 'Developing'
    | 'Proficient'
    | 'Advanced'
    | 'Expert';
}
