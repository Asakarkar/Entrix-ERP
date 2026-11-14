import { Progress, Spin } from 'antd';
import useLanguage from '@/locale/useLanguage';

const statusColors = {
  draft: 'var(--text-muted)',
  sent: 'var(--info)',
  pending: 'var(--info)',
  unpaid: 'var(--warning)',
  overdue: 'var(--danger)',
  partially: 'var(--warning)',
  paid: 'var(--success)',
  declined: 'var(--danger)',
  accepted: 'var(--success)',
  expired: 'var(--text-muted)',
};

const defaultStatistics = [
  {
    tag: 'draft',
    value: 0,
  },
  {
    tag: 'pending',
    value: 0,
  },
  {
    tag: 'sent',
    value: 0,
  },
  {
    tag: 'accepted',
    value: 0,
  },
  {
    tag: 'declined',
    value: 0,
  },
  {
    tag: 'expired',
    value: 0,
  },
];

const defaultInvoiceStatistics = [
  {
    tag: 'draft',
    value: 0,
  },
  {
    tag: 'pending',
    value: 0,
  },
  {
    tag: 'overdue',
    value: 0,
  },
  {
    tag: 'paid',
    value: 0,
  },
  {
    tag: 'unpaid',
    value: 0,
  },
  {
    tag: 'partially',
    value: 0,
  },
];

const PreviewState = ({ tag, value }) => {
  const translate = useLanguage();
  return (
    <div className="dashboard-status-row">
      <div className="dashboard-status-label">
        <span className="dashboard-status-dot" style={{ backgroundColor: statusColors[tag] }} />
        <span className="capitalize">{translate(tag)}</span>
      </div>
      <strong>{value ?? 0}%</strong>
      <Progress
        percent={value}
        showInfo={false}
        strokeColor={statusColors[tag] || 'var(--info)'}
      />
    </div>
  );
};

export default function PreviewCard({
  statistics = defaultStatistics,
  isLoading = false,
  entity = 'invoice',
}) {
  const defaultStats = entity === 'invoice' ? defaultInvoiceStatistics : defaultStatistics;
  const statisticsMap = defaultStats.map((defaultStat) => {
    const matchedStat = Array.isArray(statistics)
      ? statistics.find((stat) => stat.tag === defaultStat.tag)
      : null;
    return matchedStat || defaultStat;
  });

  return (
    <div className="dashboard-status-content">
      <div>
        {isLoading ? (
          <div className="dashboard-status-loading">
            <Spin />
          </div>
        ) : (
          <div className="dashboard-status-list">
            {statisticsMap.map((status) => (
              <PreviewState key={status.tag} tag={status.tag} value={status.value} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
