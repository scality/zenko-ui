import {
  screen,
  waitFor,
  fireEvent,
  getAllByRole,
  getByText,
} from '@testing-library/react';
import AccountUserList from '../AccountUserList';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
  Wrapper as wrapper,
} from '../../utils/testUtil';

const SAMPLE_USER_ID = 'GENERATED_ID';
const SAMPLE_USER_NAME = 'test';
const SAMPLE_CREATE_DATE = '2022-03-02T08:35:24Z';
const SAMPLE_ARN = `arn:aws:iam::970343539682:user/${SAMPLE_USER_NAME}`;
const nbrOfColumnsExpected = 4;

const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
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

describe('AccountUserList', () => {
  it('should render a table with users', async () => {
    //E
    reduxRender(<AccountUserList accountName="account" />, {
      wrapper,
    });
    //V
    //Loading state
    expect(screen.getAllByText('Loading users...')).toHaveLength(2);

    //Ensure tooltip is displayed on top of search field while loading users
    fireEvent.pointerEnter(screen.getByPlaceholderText('Search'));
    expect(
      screen.getByText('Search is disabled while loading users'),
    ).toBeInTheDocument();

    //Wait for loading to complete
    await waitFor(() => screen.getByText(SAMPLE_USER_NAME));
    //Ensure user is displayed in the table once the loading complete
    expect(screen.getByText(SAMPLE_USER_NAME)).toBeInTheDocument();

    const firstRow = screen.getAllByRole('row')[1];

    const arnButton = screen.getByText('Copy ARN');
    expect(arnButton).toBeInTheDocument();

    const eyeButton = screen.getByLabelText('Checking or creating access keys');
    expect(eyeButton).toBeInTheDocument();

    const editButton = screen.getByText('Edit');
    expect(editButton).toBeInTheDocument();

    const createdOnOfFirstRow = getAllByRole(firstRow, 'gridcell');
    expect(
      getByText(createdOnOfFirstRow[2], /2022-03-02/i),
    ).toBeInTheDocument();
  });
  it('should render header buttons and column names', async () => {
    reduxRender(<AccountUserList accountName="account" />, {
      wrapper,
    });

    /**********           Number of columns :         ************/

    expect(screen.getAllByRole('columnheader').length).toEqual(
      nbrOfColumnsExpected,
    );

    /**********           Buttons 'search' and 'Create user' exist :         ************/

    const searchZone = screen.getByPlaceholderText('Search');
    expect(searchZone).toBeInTheDocument();

    const createButton = screen.getByText('Create User');
    expect(createButton).toBeInTheDocument();

    /**********           Table columns exist :         ************/
    expect(screen.getByText('User Name')).toBeInTheDocument();
    expect(screen.getByText('Access Keys')).toBeInTheDocument();
    expect(screen.getByText('Created On')).toBeInTheDocument();
  });
  it('handles server error', async () => {
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) =>
        res(ctx.status(500, 'error')),
      ),
    );

    reduxRender(<AccountUserList accountName="account" />, {
      wrapper,
    });

    await waitFor(() =>
      screen.getByText(
        'We failed to retrieve users, please retry later. If the error persists, please contact your support.',
      ),
    );
    expect(
      screen.getByText(
        'We failed to retrieve users, please retry later. If the error persists, please contact your support.',
      ),
    ).toBeInTheDocument();
  });
});
