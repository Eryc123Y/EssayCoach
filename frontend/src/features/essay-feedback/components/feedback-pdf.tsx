import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Circle,
  Line,
  Polygon
} from '@react-pdf/renderer';

// Register font (using standard fonts for compatibility)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 }
  ]
});

// Academic Precision Design System - PDF Styles
const styles = StyleSheet.create({
  // Document base
  document: {
    fontFamily: 'Roboto',
    color: '#1a1a1a'
  },

  // Page layout
  page: {
    flexDirection: 'column',
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: '#ffffff'
  },

  // Header section
  headerContainer: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '2px solid #e5e7eb'
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.5
  },

  headerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 400
  },

  // Student info section
  studentInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6
  },

  studentInfoLeft: {
    flexDirection: 'column'
  },

  studentName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: 2
  },

  studentEmail: {
    fontSize: 10,
    color: '#6b7280'
  },

  submissionDate: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right'
  },

  // Overall score section
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    border: '1px solid #e5e7eb'
  },

  scoreTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 12
  },

  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center'
  },

  scoreNumber: {
    fontSize: 36,
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: -1
  },

  scoreMax: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: 500
  },

  scoreBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 600,
    color: '#1e40af'
  },

  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
    paddingBottom: 8,
    borderBottom: '2px solid #e5e7eb'
  },

  // Essay content section
  essaySection: {
    marginBottom: 20
  },

  essayQuestion: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8
  },

  essayContent: {
    fontSize: 10,
    color: '#1a1a1a',
    lineHeight: 1.6,
    textAlign: 'justify'
  },

  // Skills radar chart placeholder
  radarChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    marginBottom: 20,
    border: '1px solid #e5e7eb'
  },

  radarTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 16
  },

  skillsGrid: {
    position: 'relative',
    width: 200,
    height: 200
  },

  // Skills table
  skillsTable: {
    marginBottom: 20
  },

  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottom: '1px solid #f3f4f6'
  },

  skillName: {
    width: '35%',
    fontSize: 10,
    fontWeight: 500,
    color: '#374151'
  },

  skillBarContainer: {
    width: '45%',
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden'
  },

  skillBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4
  },

  skillScore: {
    width: '20%',
    fontSize: 10,
    fontWeight: 600,
    color: '#1a1a1a',
    textAlign: 'right'
  },

  // Feedback items
  feedbackContainer: {
    marginBottom: 16
  },

  feedbackItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    backgroundColor: '#fafafa'
  },

  feedbackItemCritical: {
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2'
  },

  feedbackItemSuggestion: {
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb'
  },

  feedbackItemStrength: {
    borderLeftColor: '#10b981',
    backgroundColor: '#f0fdf4'
  },

  feedbackItemInfo: {
    borderLeftColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },

  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },

  feedbackCategory: {
    fontSize: 9,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginRight: 8
  },

  feedbackTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#1a1a1a'
  },

  feedbackDescription: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.5
  },

  // Rubric breakdown
  rubricContainer: {
    marginBottom: 16
  },

  rubricItem: {
    padding: 10,
    marginBottom: 6,
    borderRadius: 6,
    backgroundColor: '#fafafa',
    border: '1px solid #e5e7eb'
  },

  rubricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },

  rubricName: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1a1a1a'
  },

  rubricScore: {
    fontSize: 10,
    fontWeight: 700,
    color: '#3b82f6'
  },

  rubricLevel: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic'
  },

  rubricJustification: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
    marginTop: 4
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: '1px solid #f3f4f6',
    paddingTop: 12
  },

  // Empty state
  emptyState: {
    padding: 20,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 10,
    fontStyle: 'italic'
  },

  // Page break helper
  pageBreak: {
    marginBottom: 30
  }
});

// Types matching the existing components
export interface ScoreData {
  category: string;
  score: number;
  fullMark: number;
  description?: string;
}

export interface Insight {
  id: string;
  type: 'critical' | 'suggestion' | 'strength' | 'info';
  category: string;
  title: string;
  description: string;
  location?: string;
}

export interface SkillData {
  grammar: number;
  logic: number;
  tone: number;
  structure: number;
  vocabulary: number;
}

export interface FeedbackPDFData {
  studentName: string;
  studentEmail: string;
  submissionDate: string;
  essayQuestion: string;
  essayContent: string;
  overallScore: number;
  scores: ScoreData[];
  skills?: SkillData; // For radar chart
  insights: Insight[];
  rubricResults?: Array<{
    criterionName: string;
    score: number;
    maxScore: number;
    levelName: string;
    justification: string;
  }>;
}

interface FeedbackPDFDocumentProps {
  data: FeedbackPDFData;
}

// Convert score to badge text
const getScoreBadge = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Passing';
  return 'Needs Work';
};

// Convert insight type to style
const getFeedbackStyle = (type: Insight['type']): string => {
  switch (type) {
    case 'critical':
      return 'feedbackItemCritical';
    case 'suggestion':
      return 'feedbackItemSuggestion';
    case 'strength':
      return 'feedbackItemStrength';
    case 'info':
      return 'feedbackItemInfo';
  }
};

// Get icon symbol for insight type
const getInsightIcon = (type: Insight['type']): string => {
  switch (type) {
    case 'critical':
      return '!';
    case 'suggestion':
      return '?';
    case 'strength':
      return '✓';
    case 'info':
      return '→';
  }
};

// Get feedback style class name
const getFeedbackStyleClass = (type: Insight['type']): keyof typeof styles => {
  switch (type) {
    case 'critical':
      return 'feedbackItemCritical';
    case 'suggestion':
      return 'feedbackItemSuggestion';
    case 'strength':
      return 'feedbackItemStrength';
    case 'info':
      return 'feedbackItemInfo';
  }
};

// Simple radar chart visualization using SVG
const RadarChart: React.FC<{ skills: SkillData }> = ({ skills }) => {
  const skillEntries = Object.entries(skills) as [keyof SkillData, number][];
  const maxScore = 100;
  const centerX = 100;
  const centerY = 100;
  const radius = 80;
  const angleStep = (2 * Math.PI) / skillEntries.length;

  // Calculate polygon points for user scores
  const userPoints = skillEntries.map(([skill, score], index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const r = (score / maxScore) * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  // Calculate grid polygon points (for 25%, 50%, 75%, 100%)
  const renderGridPolygon = (percentage: number) => {
    const r = radius * percentage;
    return skillEntries.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  // Axis lines
  const axisLines = skillEntries.map(([skill, _], index) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return (
      <Line
        key={`axis-${index}`}
        x1={centerX}
        y1={centerY}
        x2={x}
        y2={y}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    );
  });

  // Skill labels
  const skillLabels = skillEntries.map(([skill, score], index) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = radius + 15;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);

    const skillLabelMap: Record<keyof SkillData, string> = {
      grammar: 'Grammar',
      logic: 'Logic',
      tone: 'Tone',
      structure: 'Structure',
      vocabulary: 'Vocab'
    };

    return (
      <Text
        key={`label-${index}`}
        x={x}
        y={y}
        style={{ fontSize: 8, fill: '#374151', textAnchor: 'middle', dominantBaseline: 'middle' }}
      >
        {skillLabelMap[skill]}
      </Text>
    );
  });

  return (
    <Svg width="200" height="200" viewBox="0 0 200 200">
      {/* Grid polygons */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <Polygon
          key={`grid-${pct}`}
          points={renderGridPolygon(pct)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {axisLines}

      {/* User score polygon */}
      <Polygon
        points={userPoints}
        fill="#3b82f6"
        fillOpacity={0.2}
        stroke="#3b82f6"
        strokeWidth={2}
      />

      {/* Data points */}
      {skillEntries.map(([skill, score], index) => {
        const angle = index * angleStep - Math.PI / 2;
        const r = (score / maxScore) * radius;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        return (
          <Circle
            key={`point-${index}`}
            cx={x}
            cy={y}
            r={4}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={1}
          />
        );
      })}

      {/* Skill labels */}
      {skillLabels}
    </Svg>
  );
};

/**
 * Main PDF Document Component
 * Generates a comprehensive feedback report PDF
 */
export function FeedbackPDFDocument({ data }: FeedbackPDFDocumentProps) {
  const {
    studentName,
    studentEmail,
    submissionDate,
    essayQuestion,
    essayContent,
    overallScore,
    scores,
    skills,
    insights,
    rubricResults
  } = data;

  return (
    <Document>
      {/* Page 1: Summary & Overview */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Essay Feedback Report</Text>
          <Text style={styles.headerSubtitle}>
            AI-Powered Writing Analysis • Generated {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Student Information */}
        <View style={styles.studentInfoContainer}>
          <View style={styles.studentInfoLeft}>
            <Text style={styles.studentName}>{studentName || 'Student'}</Text>
            <Text style={styles.studentEmail}>{studentEmail || 'N/A'}</Text>
          </View>
          <Text style={styles.submissionDate}>
            Submitted: {submissionDate}
          </Text>
        </View>

        {/* Overall Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreTitle}>Overall Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{overallScore}</Text>
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text>{getScoreBadge(overallScore)}</Text>
          </View>
        </View>

        {/* Skill Radar Chart */}
        {skills && (
          <View style={styles.radarChartContainer}>
            <Text style={styles.radarTitle}>Skill Mastery Overview</Text>
            <RadarChart skills={skills} />
          </View>
        )}

        {/* Skills Breakdown Table */}
        {scores && scores.length > 0 && (
          <View style={styles.skillsTable}>
            <Text style={styles.sectionTitle}>Performance Breakdown</Text>
            {scores.map((item, index) => (
              <View key={index} style={styles.skillRow}>
                <Text style={styles.skillName}>{item.category}</Text>
                <View style={styles.skillBarContainer}>
                  <View
                    style={[
                      styles.skillBar,
                      { width: `${(item.score / item.fullMark) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.skillScore}>{item.score}/{item.fullMark}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Essay Content */}
        <View style={styles.essaySection}>
          <Text style={styles.sectionTitle}>Essay Question</Text>
          <Text style={styles.essayQuestion}>{essayQuestion}</Text>
        </View>

        {/* Actionable Insights */}
        {insights && insights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Actionable Insights</Text>
            <View style={styles.feedbackContainer}>
              {insights.map((insight, index) => (
                <View
                  key={index}
                  style={[
                    styles.feedbackItem,
                    styles[getFeedbackStyleClass(insight.type)]
                  ]}
                >
                  <View style={styles.feedbackHeader}>
                    <Text style={styles.feedbackCategory}>
                      [{getInsightIcon(insight.type)}] {insight.category}
                    </Text>
                  </View>
                  <Text style={styles.feedbackTitle}>{insight.title}</Text>
                  <Text style={styles.feedbackDescription}>{insight.description}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Rubric Results */}
        {rubricResults && rubricResults.length > 0 && (
          <>
            <View style={styles.pageBreak} />
            <Text style={styles.sectionTitle}>Rubric Assessment</Text>
            <View style={styles.rubricContainer}>
              {rubricResults.map((rubric, index) => (
                <View key={index} style={styles.rubricItem}>
                  <View style={styles.rubricHeader}>
                    <Text style={styles.rubricName}>{rubric.criterionName}</Text>
                    <Text style={styles.rubricScore}>
                      {rubric.score}/{rubric.maxScore}
                    </Text>
                  </View>
                  <Text style={styles.rubricLevel}>Level: {rubric.levelName}</Text>
                  <Text style={styles.rubricJustification}>
                    {rubric.justification}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by EssayCoach AI • Academic Precision Feedback System</Text>
        </View>
      </Page>
    </Document>
  );
}

export default FeedbackPDFDocument;
