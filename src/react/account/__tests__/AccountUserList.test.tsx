import { render } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import IAMClient from '../../../js/IAMClient';
import { _IAMContext } from '../../IAMProvider';
import AccountUserList from '../AccountUserList';
import { QueryClient, QueryClientProvider } from 'react-query';

const wrapper = ({ children }: PropsWithChildren<{}>) => {
  const history = createMemoryHistory();

  const params = {
    accessKey: 'accessKey',
    secretKey: 'secretKey',
    sessionToken: 'sessionToken',
  };
  const iamClient = new IAMClient('http://testendpoint');
  iamClient.login(params);
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Router history={history}>
        <_IAMContext.Provider
          value={{
            iamClient,
          }}
        >
          {children}
        </_IAMContext.Provider>
      </Router>
    </QueryClientProvider>
  );
};

describe('AccountUserList', () => {
  it('should render a table with users', () => {
    render(<AccountUserList accountName="account" />, {
      wrapper,
    });
  });
});
