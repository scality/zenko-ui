import React from 'react';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  reduxRender,
  TEST_API_BASE_URL,
  Wrapper as wrapper,
} from '../../utils/test';
import UpdateAccountPolicy from '../UpdateAccountPolicy';
import router from 'react-router';

const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    const urlParams = new URLSearchParams(req.body);
    if (urlParams.get('Action') === 'GetPolicyVersion') {
      return res(
        ctx.xml(
          `<GetPolicyVersionResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
          <GetPolicyVersionResult>
          <PolicyVersion>
          <Document>%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Effect%22%3A%22Allow%22%2C%22Action%22%3A%22s3%3AListAllMyBuckets%22%2C%22Resource%22%3A%22*%22%7D%2C%7B%22Effect%22%3A%22Allow%22%2C%22Action%22%3A%5B%22s3%3AListBucket%22%2C%22s3%3AGetBucketLocation%22%5D%2C%22Resource%22%3A%22*%22%7D%2C%7B%22Effect%22%3A%22Allow%22%2C%22Action%22%3A%5B%22s3%3AMetadataSearch%22%2C%22s3%3APutObject%22%2C%22s3%3APutObjectAcl%22%2C%22s3%3AGetObject%22%2C%22s3%3AGetObjectAcl%22%2C%22s3%3ADeleteObject%22%5D%2C%22Resource%22%3A%22*%22%7D%5D%7D</Document>
          <IsDefaultVersion>true</IsDefaultVersion><VersionId>v5</VersionId><CreateDate>2022-06-27T10:32:04Z</CreateDate>
          </PolicyVersion>
          </GetPolicyVersionResult>
          <ResponseMetadata>
            <RequestId>a3b0b4af654ab56567f6</RequestId>
          </ResponseMetadata>
        </GetPolicyVersionResponse>`,
        ),
      );
    }
    return res(
      ctx.xml(`
    <CreatePolicyVersionResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
             <CreatePolicyVersionResult>
               <PolicyVersion>
               <IsDefaultVersion>true</IsDefaultVersion>
               <VersionId>v1</VersionId>
               <CreateDate>2022-06-15T10:32:47Z</CreateDate>
               </PolicyVersion>
               </CreatePolicyVersionResult>
             <ResponseMetadata>
               <RequestId>53de191007418114e941</RequestId>
             </ResponseMetadata>
    </CreatePolicyVersionResponse>
    `),
    );
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  jest.spyOn(router, 'useParams').mockReturnValue({
    policyName: 'data-consumer-policy',
    policiesPrefix: 'arn:aws:iam::137489910101:policy',
    path: 'scality-internal',
    DefaultVersionId: 'v5',
  });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UpdateAccountPolicy', () => {
  it('should display all fields for UpdateAccountPolicy form', async () => {
    reduxRender(<UpdateAccountPolicy />, {
      wrapper,
    });
    await waitForElementToBeRemoved(
      () => [...screen.queryAllByText(/Loading/i)],
      { timeout: 8000 },
    );
    expect(screen.getByText('Policy Edition')).toBeInTheDocument();
    expect(
      screen.getByText('We are supporting AWS IAM standards.'),
    ).toBeInTheDocument();

    expect(screen.getByText('Policy Name')).toBeInTheDocument();
    expect(screen.getByText('Policy ARN')).toBeInTheDocument();
    expect(screen.getByText('Policy Document')).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: /Copy Text/i });
    expect(copyButton).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: /Save/i });
    expect(createButton).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });
  it('should display fields policy name and ARN not empty', async () => {
    reduxRender(<UpdateAccountPolicy />, {
      wrapper,
    });
    await waitForElementToBeRemoved(
      () => [...screen.queryAllByText(/Loading/i)],
      { timeout: 8000 },
    );

    const policyNameLabel = screen.getByTestId('policyNameLabel');
    expect(policyNameLabel).not.toBeEmptyDOMElement();

    const policyARNLabel = screen.getByTestId('policyARNLabel');
    expect(policyARNLabel).not.toBeEmptyDOMElement();
  });
  it('should have save button disabled and cancel button enabled at first', async () => {
    reduxRender(<UpdateAccountPolicy />, {
      wrapper,
    });

    await waitForElementToBeRemoved(
      () => [...screen.queryAllByText(/Loading/i)],
      { timeout: 8000 },
    );

    const createButton = screen.getByRole('button', { name: /Save/i });
    expect(createButton).toBeDisabled();

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelButton).not.toBeDisabled();
  });
});
