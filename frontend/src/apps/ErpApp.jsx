import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Layout } from 'antd';

import Navigation from '@/apps/Navigation/NavigationContainer';

import HeaderContent from '@/apps/Header/HeaderContainer';
import PageLoader from '@/components/PageLoader';

import { settingsAction } from '@/redux/settings/actions';

import { selectSettings } from '@/redux/settings/selectors';

import AppRouter from '@/router/AppRouter';

export default function ErpCrmApp() {
  const { Content } = Layout;

  const dispatch = useDispatch();

  useLayoutEffect(() => {
    dispatch(settingsAction.list({ entity: 'setting' }));
  }, []);

  const { isSuccess: settingIsloaded } = useSelector(selectSettings);

  if (settingIsloaded)
    return (
      <Layout className="erp-workspace" hasSider>
        <Navigation />
        <Layout>
          <HeaderContent />
          <Content className="erp-content">
            <AppRouter />
          </Content>
        </Layout>
      </Layout>
    );
  else return <PageLoader />;
}
