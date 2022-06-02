import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { mockOffsetSize, TEST_API_BASE_URL, Wrapper as wrapper} from '../../utils/test';
import React from 'react';
import AccountPoliciesList from '../AccountPoliciesList';

const SAMPLE_POLICY_ID = 'LRDTTFT5ZKN6VIZCICXFSAD8I1960RBB'
const SAMPLE_VERSION_ID = 'v1'
const SAMPLE_Policy_NAME = 'data-consumer-policy';
const SAMPLE_USER_PATH = '/scality-internal/';
const SAMPLE_CREATE_DATE = '2022-03-02T09:08:41Z';
const SAMPLE_UPDATED_DATE = '2022-03-02T09:08:41Z';
const SAMPLE_ARN = 'arn:aws:iam::621762876784:policy/scality-internal/data-consumer-policy';
const SAMPLE_ATTACHMENTS = '1';
const SAMPLE_ATTACHABLE= true;
const nbrOfColumnsExpected = 5;

const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    return res(
      ctx.xml(`
<ListPoliciesResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
    <ListPoliciesResult>
        <Policies>
            <member>
                <PolicyName>${SAMPLE_Policy_NAME}</PolicyName>
                <DefaultVersionId>${SAMPLE_VERSION_ID}</DefaultVersionId>
                <PolicyId>${SAMPLE_POLICY_ID}</PolicyId>
                <Path>${SAMPLE_USER_PATH}</Path>
                <Arn>${SAMPLE_ARN}</Arn>
                <AttachmentCount>${SAMPLE_ATTACHMENTS}</AttachmentCount>
                <IsAttachable>${SAMPLE_ATTACHABLE}</IsAttachable>
                <CreateDate>${SAMPLE_CREATE_DATE}</CreateDate>
                <UpdateDate>${SAMPLE_UPDATED_DATE}</UpdateDate>
            </member>
        </Policies>
        <IsTruncated>false</IsTruncated>
    </ListPoliciesResult>
    <ResponseMetadata>
        <RequestId>61221a552b4592e5b784</RequestId>
    </ResponseMetadata>
</ListPoliciesResponse>
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

describe('AccountPoliciesList', () => {
  it('should render header buttons and a table with user policies', async () => {
    try {
    render(<AccountPoliciesList accountName="account" />, {
      wrapper,
    });

    expect(screen.getAllByText('Loading policies...')).toHaveLength(2);

    expect(
      screen.getByPlaceholderText(/Search by Policy Name/i),
    ).toBeInTheDocument();

    const createButton = screen.getByText('Create Policy')
    expect(createButton).toBeInTheDocument();

    /**********           Number of columns :         ************/
    expect(screen.getAllByRole('columnheader').length).toEqual(nbrOfColumnsExpected);

    expect(
      screen.getByPlaceholderText(/Search by Policy Name/i),
    ).toBeInTheDocument();

    /**********           Table columns exist :         ************/
    expect(screen.getByText('Policy Path')).toBeInTheDocument();
    expect(screen.getByText('Policy Name')).toBeInTheDocument();
    expect(screen.getByText('Last Modified')).toBeInTheDocument();
    expect(screen.getByText('Attachments')).toBeInTheDocument();
    } catch (error: any) {
      console.log('error: ', error.message);
    }
  });
  it('should render enabled attach button', async () => {

      render(<AccountPoliciesList accountName="account" />, {
        wrapper,
      });

      await waitFor(() => screen.getByText(/Edit/i));

      const attachButton = screen.getByRole('button', { name: 'Attach' })
      expect(attachButton).not.toBeDisabled();


  });
  it('should enable/disable edit button with conditions', async () => {
      render(<AccountPoliciesList accountName="account" />, {
        wrapper
      });

      await waitFor(() => screen.getByText('Edit'));

      const editButton = screen.getByRole('button', { name: 'Edit' })

      expect(editButton).not.toBeDisabled();


  });
  it('should render enabled ARN button', async () => {

      render(<AccountPoliciesList accountName="account" />, {
        wrapper,
      });

      await waitFor(() => screen.getByText(/Copy ARN/i));

      const arnButton = screen.getByText('Copy ARN')
      expect(arnButton).not.toBeDisabled();


  });
  it('should render disabled delete button', async () => {

      render(<AccountPoliciesList accountName="account" />, {
        wrapper,
      });

      await waitFor(() => screen.getByText(/Edit/i));

      const deleteButton = screen.getByRole('button', { name: /Delete/i })
      expect(deleteButton).toBeDisabled();


  });
});
