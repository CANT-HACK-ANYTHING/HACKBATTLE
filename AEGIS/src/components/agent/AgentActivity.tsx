import React from 'react';
import type { AgentActivityItem } from '../../api/types';

interface AgentActivityProps {
  activity?: AgentActivityItem[];
}

export const AgentActivity: React.FC<AgentActivityProps> = ({ activity }) => {
  if (!activity || activity.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Recent Activity
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {activity.slice(0, 3).map((item) => (
          <div
            key={item.id}
            style={{
              fontSize: 10.5,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              lineHeight: 1.3,
            }}
          >
            <span style={{ color: 'var(--teal)', fontSize: 12 }}>&bull;</span>
            <span style={{ flex: 1 }}>{item.title}</span>
            <span style={{ fontSize: 9, color: 'var(--muted-2)' }}>{item.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
