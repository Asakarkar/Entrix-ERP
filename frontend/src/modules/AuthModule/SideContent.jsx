import { Layout } from 'antd';
import logoMark from '@/logo-icon.svg';

const { Content } = Layout;

export default function SideContent() {
  return (
    <Content className="sideContent auth-side-content">
      <div className="auth-side-brand">
        <img src={logoMark} alt="" />
        <span>ENTRIX ERP</span>
      </div>
      <div className="auth-side-kicker">One connected workspace</div>
      <h2>Bring your business into focus.</h2>
      <p className="auth-side-copy">
        Keep customers, invoices, and payments moving together in one clear view.
      </p>
      <div className="auth-preview" aria-hidden="true">
        <div className="auth-preview-top">
          <span>Business overview</span>
          <span className="auth-preview-live">Workspace ready</span>
        </div>
        <div className="auth-preview-stats">
          <div className="auth-preview-stat">
            <span>Invoices</span>
            <strong>Overview</strong>
          </div>
          <div className="auth-preview-stat">
            <span>Customers</span>
            <strong>Contacts</strong>
          </div>
          <div className="auth-preview-stat">
            <span>Payments</span>
            <strong>Activity</strong>
          </div>
        </div>
        <div className="auth-preview-chart">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </Content>
  );
}
