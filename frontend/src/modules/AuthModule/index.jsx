import useLanguage from '@/locale/useLanguage';

import { Layout, Typography } from 'antd';

import AuthLayout from '@/layout/AuthLayout';
import SideContent from './SideContent';

import logo from '@/style/images/logo.svg';

const { Content } = Layout;
const { Title } = Typography;

const AuthModule = ({ authContent, AUTH_TITLE, isForRegistre = false }) => {
  const translate = useLanguage();
  const subtitle =
    AUTH_TITLE === 'Forget Password'
      ? 'Enter your email and we will send a reset link.'
      : AUTH_TITLE === 'Reset Password'
        ? 'Choose a new password for your account.'
        : 'Sign in to your ERP workspace';

  return (
    <AuthLayout sideContent={<SideContent />}>
      <Content className={`auth-form-content${isForRegistre ? ' auth-form-register' : ''}`}>
        <img className="auth-brand" src={logo} alt="ENTRIX ERP" />
        <Title level={1}>{translate(AUTH_TITLE)}</Title>
        <p className="auth-subtitle">{translate(subtitle)}</p>
        <div className="site-layout-content">{authContent}</div>
        <p className="auth-footer">© {new Date().getFullYear()} ENTRIX ERP. All rights reserved.</p>
      </Content>
    </AuthLayout>
  );
};

export default AuthModule;
