import React from 'react';
import { Filter } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';

const STAGE_COLORS: Record<string, string> = {
  New: '#22d3ee',
  Proposal: '#a78bfa',
  Cold: '#818cf8',
  Negotiation: '#fb923c',
};

const STAGE_ORDER = ['New', 'Proposal', 'Cold', 'Negotiation'];

export const MyPipelineFunnelWidget: React.FC<WidgetProps> = ({ onDetailClick }) => {
  const { mySummary } = useDashboardData();
  const raw: any[] = mySummary?.pipelineDealsByStage ?? [];

  // Sort stages in funnel order, largest first at top
  const stageMap = Object.fromEntries(raw.map((r: any) => [r.stage, r]));
  const stages = STAGE_ORDER
    .filter(s => stageMap[s])
    .map(s => stageMap[s]);
  // Add any extra stages not in STAGE_ORDER
  raw.forEach(r => { if (!STAGE_ORDER.includes(r.stage)) stages.push(r); });

  // Sort by count descending for funnel visual
  stages.sort((a, b) => b.count - a.count);

  const totalDeals = stages.reduce((s: number, st: any) => s + st.count, 0);
  const maxCount = stages.length > 0 ? Math.max(...stages.map((s: any) => s.count)) : 1;

  const svgW = 300;
  const rowH = 50;
  const svgH = stages.length * rowH + 10;
  const cx = svgW / 2;
  const minWidth = 40;
  const maxWidth = svgW - 40;

  return (
    <AnalyticsCard
      icon={<Filter className="w-4 h-4" />}
      iconBg="bg-violet-50 dark:bg-violet-900/30"
      iconColor="text-violet-600 dark:text-violet-400"
      title="My Pipeline Deals By Stage"
      titleColor="text-violet-700 dark:text-violet-400"
      subtitle={`${totalDeals} deal${totalDeals !== 1 ? 's' : ''} in pipeline`}
      onClick={() => onDetailClick?.()}
    >
      {stages.length === 0 ? (
        <div className="h-32 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No pipeline data</p>
        </div>
      ) : (
        <div className="flex justify-center">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[300px]" preserveAspectRatio="xMidYMid meet">
            {stages.map((stage: any, i: number) => {
              const topW = i === 0 ? maxWidth : minWidth + ((stages[i - 1].count / maxCount) * (maxWidth - minWidth));
              const botW = minWidth + ((stage.count / maxCount) * (maxWidth - minWidth));
              const y = i * rowH + 5;
              const color = STAGE_COLORS[stage.stage] || '#94a3b8';

              const points = [
                `${cx - topW / 2},${y}`,
                `${cx + topW / 2},${y}`,
                `${cx + botW / 2},${y + rowH - 4}`,
                `${cx - botW / 2},${y + rowH - 4}`,
              ].join(' ');

              return (
                <g key={stage.stage}>
                  <polygon points={points} fill={color} opacity={0.85} rx="4" />
                  <text
                    x={cx}
                    y={y + rowH / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {stage.stage}: {stage.count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </AnalyticsCard>
  );
};
