import {
  render,
  screen,
  waitFor,
  fireEvent,
  prettyDOM,
  getAllByRole,
  getByLabelText,
  getByText, getByPlaceholderText, getByTitle,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import IAMClient from '../../../js/IAMClient';
import { _IAMContext } from '../../IAMProvider';
import AccountUserList from '../AccountUserList';
import { QueryClient, QueryClientProvider } from 'react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { ReactNode } from 'react';

const SAMPLE_USER_ID = 'GENERATED_ID';
const SAMPLE_USER_NAME = 'test';
const SAMPLE_CREATE_DATE = '2022-03-02T08:35:24Z';
const SAMPLE_ARN = `arn:aws:iam::970343539682:user/${SAMPLE_USER_NAME}`;
const nbrOfColumnsExpectedWithoutEdit = 4;

// AutoSizer uses offsetWidth and offsetHeight.
// Jest runs in JSDom which doesn't support measurements APIs.
function mockOffsetSize(width: number, height: number) {
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => {
      return {
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 10,
        fontSize: 14
      };
    },
  });

  Object.defineProperties(window.HTMLElement.prototype, {
    offsetHeight: {
      get: () => {
        return height || 100;
      },
    },
    offsetWidth: {
      get: () => {
        return width || 100;
      },
    },
  });
}

const server = setupServer(
  rest.post('http://testendpoint/', (req, res, ctx) => {
    return res(
      ctx.xml(`
    <ListUsersResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <ListUsersResult>
            <Users>
                <member>
                    <UserId>${SAMPLE_USER_ID}</UserId>
                    <Path>/</Path>
                    <UserName>${SAMPLE_USER_NAME}</UserName>
                    <Arn>${SAMPLE_ARN}</Arn>
                    <CreateDate>${SAMPLE_CREATE_DATE}</CreateDate>
                </member>
            </Users>
            <IsTruncated>false</IsTruncated>
        </ListUsersResult>
        <ResponseMetadata>
            <RequestId>61221a552b4592e5b784</RequestId>
        </ResponseMetadata>
    </ListUsersResponse>
    `),
    );
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 100);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const wrapper = ({ children }: { children: ReactNode}) => {
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
  it.skip('should render a table with users', async () => {
    //E
    render(<AccountUserList accountName="account" />, {
      wrapper,
    });
    //V
    //Loading state
    expect(screen.getAllByText('Loading users...')).toHaveLength(2);

    //Ensure tooltip is displayed on top of search field while loading users
    fireEvent.mouseOver(screen.getByPlaceholderText('Search'));
    expect(
      screen.getByText('Search is disabled while loading users'),
    ).toBeInTheDocument();

    //Wait for loading to complete
    await waitFor(() => screen.getByText(SAMPLE_USER_NAME));
    //Ensure user is displayed in the table once the loading complete
    expect(screen.getByText(SAMPLE_USER_NAME)).toBeInTheDocument();

    //TODO test copy arn
  });
  it.only('test1', async () => {

    render(<AccountUserList accountName="account" />, {
      wrapper,
    });
    /**********           Number of columns :         ************/

    expect(screen.getAllByRole('columnheader').length).toEqual(nbrOfColumnsExpectedWithoutEdit);

    /**********           Buttons 'search' and 'Create user' exist :         ************/
    const searchZone = screen.getAllByRole('button')[0];
    expect(
      searchZone.getElementsByClassName('fas fa-search')[0].className,
    ).toBeDefined();

    const createButton = screen.getAllByRole('button')[2];

    expect(getByText(
      createButton,
      new RegExp('Create User'),
    )).toBeInTheDocument();

    /**********           Table columns exist :         ************/
    const firstColumn = screen.getAllByRole('columnheader')[0];
    expect(
      firstColumn.textContent,
    ).toEqual('User Name');

    const secondColumn = screen.getAllByRole('columnheader')[1];
    expect(
      secondColumn.textContent,
    ).toEqual('Access Keys');

    const thirdColumn = screen.getAllByRole('columnheader')[2];
    expect(
      thirdColumn.textContent,
    ).toEqual('Created On');

    /**********           Table columns exist :         ************/

    const firstRow = screen.getAllByRole('row')[1];
    //const gridCellOfFirstRow = getAllByRole(firstRow, 'grid');
    console.log("prettyDom***: ", prettyDOM(screen.getAllByRole('row')[1]));

    /**********           Loading users :         ************/
    expect(screen.getAllByText("Loading users...")[0]).toBeInTheDocument();

  });
});
