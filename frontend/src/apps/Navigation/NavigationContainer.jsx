import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Drawer, Layout, Menu } from 'antd';

import useLanguage from '@/locale/useLanguage';
import logoMark from '@/logo-icon.svg';

import useResponsive from '@/hooks/useResponsive';

import {
  SettingOutlined,
  CustomerServiceOutlined,
  ContainerOutlined,
  DashboardOutlined,
  CreditCardOutlined,
  MenuOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileSidebar /> : <Sidebar />;
}

function Sidebar({ isMobile = false }) {
  const location = useLocation();
  const translate = useLanguage();

  const primaryItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      title: translate('dashboard'),
      label: <Link to={'/'}>{translate('dashboard')}</Link>,
    },
    {
      key: 'customer',
      icon: <CustomerServiceOutlined />,
      title: translate('customers'),
      label: <Link to={'/customer'}>{translate('customers')}</Link>,
    },
    {
      key: 'invoice',
      icon: <ContainerOutlined />,
      title: translate('invoices'),
      label: <Link to={'/invoice'}>{translate('invoices')}</Link>,
    },
    {
      key: 'payment',
      icon: <CreditCardOutlined />,
      title: translate('payments'),
      label: <Link to={'/payment'}>{translate('payments')}</Link>,
    },
  ];

  const utilityItems = [
    {
      key: 'generalSettings',
      label: <Link to={'/settings'}>{translate('settings')}</Link>,
      icon: <SettingOutlined />,
      title: translate('settings'),
    },
    {
      key: 'about',
      label: <Link to={'/about'}>{translate('about')}</Link>,
      icon: <InfoCircleOutlined />,
      title: translate('about'),
    },
  ];

  const path = location.pathname;
  const selectedKey = path === '/'
    ? 'dashboard'
    : path.startsWith('/customer')
      ? 'customer'
      : path.startsWith('/invoice')
        ? 'invoice'
        : path.startsWith('/payment')
          ? 'payment'
          : path.startsWith('/settings')
            ? 'generalSettings'
            : path === '/about'
              ? 'about'
              : '';

  return (
    <Sider
      collapsible
      collapsed={!isMobile}
      collapsedWidth={72}
      trigger={null}
      className={`navigation${isMobile ? ' navigation-mobile' : ''}`}
      width={isMobile ? 256 : 72}
      style={{
        overflow: 'auto',
        height: '100vh',
      }}
      theme={'light'}
    >
      <Link className="logo" to="/" aria-label={translate('dashboard')}>
        <img src={logoMark} alt="ENTRIX ERP" />
      </Link>
      <Menu
        className="nav-primary"
        items={primaryItems}
        mode="inline"
        theme={'light'}
        selectedKeys={[selectedKey]}
      />
      <div className="nav-spacer" />
      <Menu
        className="nav-utility"
        items={utilityItems}
        mode="inline"
        theme={'light'}
        selectedKeys={[selectedKey]}
      />
    </Sider>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  useEffect(() => {
    setVisible(false);
  }, [location.pathname]);

  return (
    <>
      <Button
        type="text"
        size="large"
        onClick={showDrawer}
        className="mobile-sidebar-btn"
        aria-label="Open navigation"
      >
        <MenuOutlined style={{ fontSize: 18 }} />
      </Button>
      <Drawer
        width={250}
        title="Navigation"
        placement={'left'}
        closable
        onClose={onClose}
        open={visible}
        className="mobile-navigation-drawer"
      >
        <Sidebar isMobile={true} />
      </Drawer>
    </>
  );
}
