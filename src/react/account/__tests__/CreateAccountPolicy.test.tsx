import { screen, act } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
  Wrapper as wrapper,
} from '../../utils/test';
import CreateAccountPolicy from '../CreateAccountPolicy';
import userEvent from '@testing-library/user-event';

const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    return res(
      ctx.xml(`
    <ListUsersResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <CreatePolicyResult>
          <Policy>
            <PolicyName>S3-read-only-example-bucket</PolicyName>
            <DefaultVersionId>v1</DefaultVersionId>
            <PolicyId>AGPACKCEVSQ6C2EXAMPLE</PolicyId>
            <Path>/</Path>
            <Arn>arn:aws:iam::123456789012:policy/S3-read-only-example-bucket</Arn>
            <AttachmentCount>0</AttachmentCount>
            <CreateDate>2014-09-15T17:36:14.673Z</CreateDate>
            <UpdateDate>2014-09-15T17:36:14.673Z</UpdateDate>
          </Policy>
        </CreatePolicyResult>
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

describe('CreateAccountPolicy', () => {
  it('should display all fields for CreateAccountPolicy form', async () => {
    reduxRender(<CreateAccountPolicy />, {
      wrapper,
    });
    expect(screen.getByText('Policy Creation')).toBeInTheDocument();
    expect(screen.getByText('All * are mandatory fields')).toBeInTheDocument();
    expect(
      screen.getByText('We are supporting AWS IAM standards.'),
    ).toBeInTheDocument();

    const policyNameInput = screen.getByTestId('policyNameInput');
    expect(policyNameInput).toBeInTheDocument();

    const policyDocumentInput = screen.getByTestId('policyDocumentInput');
    expect(policyDocumentInput).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: /Copy Text/i });
    expect(copyButton).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: /Create/i });
    expect(createButton).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });
  it('should disable Create button if policy name input and policy document textarea are empty', async () => {
    reduxRender(<CreateAccountPolicy />, {
      wrapper,
    });
    const policyNameInput = screen.getByTestId('policyNameInput');
    const policyDocumentInput = screen.getByTestId('policyDocumentInput');
    act(() => {
      userEvent.type(policyNameInput, '');
    });
    act(() => {
      userEvent.type(policyDocumentInput, '');
    });
    const createButton = screen.getByRole('button', { name: /Create/i });
    act(() => {
      userEvent.click(createButton);
    });
    expect(createButton).toBeDisabled();
  });
  it('should check if alert message is displayed when we click on Create button with the policy name input empty ', async () => {
    reduxRender(<CreateAccountPolicy />, {
      wrapper,
    });
    const policyNameInput = screen.getByTestId('policyNameInput');
    act(() => {
      userEvent.type(policyNameInput, '');
    });
    const policyDocumentInput = screen.getByTestId('policyDocumentInput');
    act(() => {
      userEvent.type(policyDocumentInput, 'document');
    });
    const createButton = screen.getByRole('button', { name: /Create/i });
    expect(createButton).not.toBeDisabled();
    act(() => {
      userEvent.click(createButton);
    });
    const policyNameAlert = screen.getAllByRole('alert')[0];
    expect(policyNameAlert).toBeInTheDocument();
  });
  it('should check if Copy button is enabled if policy document is not empty', async () => {
    reduxRender(<CreateAccountPolicy />, {
      wrapper,
    });
    const policyDocumentInput = screen.getByTestId('policyDocumentInput');

    const copyButton = screen.getByRole('button', { name: /Copy Text/i });
    expect(copyButton).toBeDisabled();
    act(() => {
      userEvent.type(policyDocumentInput, 'document');
    });
    expect(copyButton).not.toBeDisabled();
  });
});
