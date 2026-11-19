import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, Dropdown, Layout, Button } from 'antd';

// import Notifications from '@/components/Notification';

import { DownOutlined, LogoutOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';

import { selectCurrentAdmin } from '@/redux/auth/selectors';

import { FILE_BASE_URL } from '@/config/serverApiConfig';

import useLanguage from '@/locale/useLanguage';

export default function HeaderContent() {
  const currentAdmin = useSelector(selectCurrentAdmin);
  const { Header } = Layout;
  const location = useLocation();
  const translate = useLanguage();
  const path = location.pathname;
  const pageTitle =
    path === '/'
      ? translate('Dashboard')
      : path.startsWith('/invoice/create')
        ? translate('New invoice')
        : path.startsWith('/invoice')
          ? translate('invoices')
          : path.startsWith('/customer')
            ? translate('customers')
            : path.startsWith('/project')
              ? 'Projects'
              : path.startsWith('/inventory')
                ? 'Inventory'
            : path.startsWith('/payment')
              ? translate('payments')
              : path.startsWith('/settings')
                ? translate('settings')
                : path === '/profile'
                  ? translate('profile_settings')
                  : translate('about');

  const ProfileDropdown = () => {
    return (
      <Link className="profileDropdown" to="/profile">
        <Avatar
          size="large"
          src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
          className="profile-dropdown-avatar"
        >
          {currentAdmin?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        <div className="profileDropdownInfo">
          <p>
            {currentAdmin?.name} {currentAdmin?.surname}
          </p>
          <p>{currentAdmin?.email}</p>
        </div>
      </Link>
    );
  };

  const items = [
    {
      label: <ProfileDropdown className="headerDropDownMenu" />,
      key: 'ProfileDropdown',
    },
    {
      type: 'divider',
    },
    {
      icon: <UserOutlined />,
      key: 'settingProfile',
      label: <Link to={'/profile'}>{translate('profile_settings')}</Link>,
    },
    {
      icon: <ToolOutlined />,
      key: 'settingApp',
      label: <Link to={'/settings'}>{translate('app_settings')}</Link>,
    },

    {
      type: 'divider',
    },

    {
      icon: <LogoutOutlined />,
      key: 'logout',
      label: <Link to={'/logout'}>{translate('logout')}</Link>,
    },
  ];

  return (
    <Header className="erp-header">
      <div className="erp-header-title">
        <span className="erp-header-eyebrow">ENTRIX ERP · WORKSPACE</span>
        <h1>{pageTitle}</h1>
      </div>
      <div className="erp-header-actions">
        <Dropdown
          menu={{
            items,
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" className="profile-trigger" aria-label="Open account menu">
            <Avatar
              src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
              size="large"
            >
              {currentAdmin?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <span className="profile-trigger-name">
              {currentAdmin?.name} {currentAdmin?.surname}
              <small>{currentAdmin?.email}</small>
            </span>
            <DownOutlined />
          </Button>
        </Dropdown>
      </div>
    </Header>
  );
}

//  console.log(
//    '🚀 Welcome to IDURAR ERP CRM! Did you know that we also offer commercial customization services? Contact us at hello@idurarapp.com for more information.'
//  );
