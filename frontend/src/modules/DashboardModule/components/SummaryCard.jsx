import { Col, Spin, Tooltip } from 'antd';
import { useMoney } from '@/settings';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';

export default function SummaryCard({
  title,
  data,
  prefix,
  isLoading = false,
  dataType = 'currency',
  icon,
  tone = 'info',
}) {
  const { moneyFormatter } = useMoney();
  const moneyFormatSettings = useSelector(selectMoneyFormat);
  const formattedValue =
    dataType === 'percent'
      ? `${Number(data || 0)}%`
      : moneyFormatter({
          amount: data || 0,
          currency_code: moneyFormatSettings?.default_currency_code,
        });

  return (
    <Col xs={24} sm={12} xl={6}>
      <div className="dashboard-kpi">
        <div className={`dashboard-kpi-icon dashboard-kpi-icon-${tone}`}>{icon}</div>
        <div className="dashboard-kpi-label">{title}</div>
        <Tooltip title={isLoading ? undefined : formattedValue}>
          <div className="dashboard-kpi-value">
            {isLoading ? <Spin size="small" /> : formattedValue}
          </div>
        </Tooltip>
        <div className="dashboard-kpi-meta">{prefix}</div>
      </div>
    </Col>
  );
}
