import { Button, Result } from 'antd';

import useLanguage from '@/locale/useLanguage';

const About = () => {
  const translate = useLanguage();
  return (
    <Result
      status="info"
      title={'ENTRIX ERP'}
      subTitle={translate('Do you need help on customize of this app')}
      extra={
        <>
          <p>
            Website : <a href="https://adityasakarkar.in">https://adityasakarkar.in</a>{' '}
          </p>
          <p>
            GitHub :{' '}
            <a href="https://github.com/Asakarkar/Entrix-ERP">
              https://github.com/Asakarkar/Entrix-ERP
            </a>
          </p>
          <Button
            type="primary"
            onClick={() => {
              window.open(`https://adityasakarkar.in/contact`);
            }}
          >
            {translate('Contact us')}
          </Button>
        </>
      }
    />
  );
};

export default About;
