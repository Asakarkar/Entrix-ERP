import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ProjectOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const navigationPaths = {
  dashboard: '/',
  customer: '/customer',
  invoice: '/invoice',
  project: '/project',
  payment: '/payment',
  generalSettings: '/settings',
  about: '/about',
};

export default function Navigation() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileSidebar /> : <Sidebar />;
}

function Sidebar({ isMobile = false }) {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const translate = useLanguage();

  const primaryItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      title: translate('dashboard'),
      label: translate('dashboard'),
    },
    {
      key: 'customer',
      icon: <CustomerServiceOutlined />,
      title: translate('customers'),
      label: translate('customers'),
    },
    {
      key: 'invoice',
      icon: <ContainerOutlined />,
      title: translate('invoices'),
      label: translate('invoices'),
    },
    {
      key: 'project',
      icon: <ProjectOutlined />,
      title: 'Projects',
      label: 'Projects',
    },
    {
      key: 'payment',
      icon: <CreditCardOutlined />,
      title: translate('payments'),
      label: translate('payments'),
    },
  ];

  const utilityItems = [
    {
      key: 'generalSettings',
      label: translate('settings'),
      icon: <SettingOutlined />,
      title: translate('settings'),
    },
    {
      key: 'about',
      label: translate('about'),
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
        : path.startsWith('/project')
          ? 'project'
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
      collapsed={!isMobile && !expanded}
      collapsedWidth={72}
      trigger={null}
      className={`navigation${isMobile ? ' navigation-mobile' : ''}${expanded && !isMobile ? ' navigation-expanded' : ''}`}
      width={isMobile ? 256 : expanded ? 240 : 72}
      style={{
        overflow: 'auto',
        height: '100vh',
      }}
      theme={'light'}
    >
      <Link className="logo" to="/" aria-label={translate('dashboard')}>
        <img src={logoMark} alt="ENTRIX ERP" />
      </Link>
      {!isMobile && (
        <Button
          type="text"
          className="desktop-navigation-toggle"
          icon={<MenuOutlined />}
          aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        />
      )}
      <Menu
        className="nav-primary"
        items={primaryItems}
        mode="inline"
        theme={'light'}
        selectedKeys={[selectedKey]}
        onClick={({ key }) => navigate(navigationPaths[key])}
      />
      <div className="nav-spacer" />
      <Menu
        className="nav-utility"
        items={utilityItems}
        mode="inline"
        theme={'light'}
        selectedKeys={[selectedKey]}
        onClick={({ key }) => navigate(navigationPaths[key])}
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
