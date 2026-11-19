import { useEffect } from 'react';
import dayjs from 'dayjs';
import { Button, Col, Row, Tag } from 'antd';
import {
  ArrowRightOutlined,
  BankOutlined,
  CalendarOutlined,
  FileAddOutlined,
  FileTextOutlined,
  ShopOutlined,
  TeamOutlined,
  UserAddOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import useLanguage from '@/locale/useLanguage';
import { useMoney, useDate } from '@/settings';
import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import useOnFetch from '@/hooks/useOnFetch';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { tagColor } from '@/utils/statusTagColor';

import RecentTable from './components/RecentTable';
import SummaryCard from './components/SummaryCard';
import PreviewCard from './components/PreviewCard';
import CustomerPreviewCard from './components/CustomerPreviewCard';

export default function DashboardModule() {
  const translate = useLanguage();
  const navigate = useNavigate();
  const admin = useSelector(selectCurrentAdmin);
  const { moneyFormatter } = useMoney();
  const { dateFormat } = useDate();
  const moneyFormatSettings = useSelector(selectMoneyFormat);
  const currency = moneyFormatSettings?.default_currency_code || null;
  const firstName = (admin?.name || '').trim().split(/\s+/)[0] || 'there';
  const hour = dayjs().hour();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const welcomeGreeting = admin?.name ? `${greeting}, ${firstName}` : greeting;

  const {
    result: invoiceResult,
    isLoading: invoiceLoading,
    onFetch: fetchInvoicesStats,
  } = useOnFetch();
  const {
    result: paymentResult,
    isLoading: paymentLoading,
    onFetch: fetchPaymentsStats,
  } = useOnFetch();
  const { result: clientResult, isLoading: clientLoading } = useFetch(() =>
    request.summary({ entity: 'client' })
  );

  useEffect(() => {
    if (!currency) return;

    fetchInvoicesStats(request.summary({ entity: 'invoice', options: { currency } }));
    fetchPaymentsStats(request.summary({ entity: 'payment', options: { currency } }));
  }, [currency, fetchInvoicesStats, fetchPaymentsStats]);

  const invoiceColumns = [
    { title: translate('Number'), dataIndex: 'number' },
    { title: translate('Client'), dataIndex: ['client', 'name'] },
    {
      title: translate('Total'),
      dataIndex: 'total',
      render: (total, record) => moneyFormatter({ amount: total, currency_code: record.currency }),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      render: (status) => {
        const statusTag = tagColor(status);
        return <Tag color={statusTag.color || 'default'}>{translate(statusTag.label)}</Tag>;
      },
    },
  ];

  const paymentColumns = [
    { title: translate('Number'), dataIndex: 'number' },
    { title: translate('Client'), dataIndex: ['client', 'name'] },
    {
      title: translate('Amount'),
      dataIndex: 'amount',
      render: (amount, record) =>
        moneyFormatter({ amount, currency_code: record.currency }),
    },
    {
      title: translate('Date'),
      dataIndex: 'date',
      render: (date) => dayjs(date).format(dateFormat),
    },
  ];

  return (
    <main className="dashboard-page">
      <header className="dashboard-welcome">
        <div className="dashboard-welcome-content">
          <div className="dashboard-welcome-eyebrow">
            <span />
            BUSINESS OVERVIEW
          </div>
          <h1>{welcomeGreeting}</h1>
          <p>Here's what's happening across your business today.</p>
          <div className="dashboard-welcome-date">
            <CalendarOutlined />
            <span>{dayjs().format('dddd, MMMM D, YYYY')}</span>
          </div>
        </div>
        <div className="dashboard-welcome-actions" aria-label="Quick actions">
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            onClick={() => navigate('/invoice/create')}
          >
            Create invoice
          </Button>
          <Button
            icon={<UserAddOutlined />}
            onClick={() => navigate('/customer')}
          >
            Customers
          </Button>
          <Button
            type="text"
            icon={<ShopOutlined />}
            onClick={() => navigate('/inventory')}
          >
            Inventory
          </Button>
        </div>
      </header>

      <Row gutter={[16, 16]} className="dashboard-kpi-row">
        <SummaryCard
          title={translate('Invoice value')}
          prefix={translate('All invoices')}
          data={invoiceResult?.total}
          isLoading={invoiceLoading}
          icon={<FileTextOutlined />}
          tone="info"
        />
        <SummaryCard
          title={translate('Payments received')}
          prefix={translate('Recorded payments')}
          data={paymentResult?.total}
          isLoading={paymentLoading}
          icon={<BankOutlined />}
          tone="success"
        />
        <SummaryCard
          title={translate('Outstanding')}
          prefix={translate('Unpaid and partial')}
          data={invoiceResult?.total_undue}
          isLoading={invoiceLoading}
          icon={<WarningOutlined />}
          tone="warning"
        />
        <SummaryCard
          title={translate('Active customers')}
          prefix={translate('Of customer base')}
          data={clientResult?.active}
          dataType="percent"
          isLoading={clientLoading}
          icon={<TeamOutlined />}
          tone="purple"
        />
      </Row>

      <Row gutter={[16, 16]} className="dashboard-panels">
        <Col xs={24} lg={15}>
          <section className="whiteBox dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>{translate('Invoice status')}</h2>
                <p>{translate('Status breakdown across your invoices')}</p>
              </div>
              <span className="dashboard-panel-icon">
                <FileTextOutlined />
              </span>
            </div>
            <PreviewCard
              isLoading={invoiceLoading}
              entity="invoice"
              statistics={invoiceResult?.performance?.map((item) => ({
                tag: item.status,
                value: item.percentage,
              }))}
            />
          </section>
        </Col>
        <Col xs={24} lg={9}>
          <CustomerPreviewCard
            isLoading={clientLoading}
            activeCustomer={clientResult?.active}
            newCustomer={clientResult?.new}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="dashboard-panels dashboard-recent">
        <Col xs={24} xl={12}>
          <section className="whiteBox dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>{translate('Recent Invoices')}</h2>
                <p>{translate('The latest activity in your workspace')}</p>
              </div>
              <Button type="link" onClick={() => navigate('/invoice')}>
                View all <ArrowRightOutlined />
              </Button>
            </div>
            <RecentTable entity="invoice" dataTableColumns={invoiceColumns} />
          </section>
        </Col>
        <Col xs={24} xl={12}>
          <section className="whiteBox dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>{translate('Recent Payments')}</h2>
                <p>{translate('Recently recorded customer payments')}</p>
              </div>
              <Button type="link" onClick={() => navigate('/payment')}>
                View all <ArrowRightOutlined />
              </Button>
            </div>
            <RecentTable entity="payment" dataTableColumns={paymentColumns} />
          </section>
        </Col>
      </Row>
    </main>
  );
}
