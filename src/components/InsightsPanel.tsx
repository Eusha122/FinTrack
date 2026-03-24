'use client';

import React from 'react';
import { TrendingDown, Info, AlertTriangle } from 'lucide-react';

interface Insight {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'positive';
}

interface InsightsPanelProps {
  insights: Insight[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingDown size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      {insights.map(insight => (
        <div key={insight.id} className="insight-card">
          <div className="insight-icon">
            {getIcon(insight.type)}
          </div>
          <div className="insight-text">{insight.text}</div>
        </div>
      ))}
    </div>
  );
}
