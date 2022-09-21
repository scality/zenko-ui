import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import Tags from '../Tags';
import {
  reduxMount,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../../../utils/test';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Tags', () => {
  const instanceId = 'instanceId';
  const accountId = 'accountId';

  const tagsConfig = {
    instances: {
      selectedId: instanceId,
    },
    auth: {
      config: { features: [] },
      selectedAccount: { id: accountId },
    },
    oidc: {
      user: {
        access_token: '',
      },
    },
    configuration: {
      latest: {
        endpoints: [],
      },
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Tags should render', async () => {
    const { component } = reduxMount(
      <Tags
        bucketName={OBJECT_METADATA.bucketName}
        objectKey={OBJECT_METADATA.objectKey}
        tags={OBJECT_METADATA.tags}
        versionId={OBJECT_METADATA.versionId}
      />,
      {},
    );
    expect(component.find(Tags).isEmptyRender()).toBe(false);
  });
  it('should render by default an Item with empty values in each input when there are no key/value present', () => {
    reduxRender(
      <Tags
        bucketName={OBJECT_METADATA.bucketName}
        objectKey={OBJECT_METADATA.objectKey}
        tags={OBJECT_METADATA.tags}
        versionId={OBJECT_METADATA.versionId}
      />,
      tagsConfig,
    );

    expect(screen.getByRole('textbox', { name: 'Tag 1 key' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Tag 1 value' })).toHaveValue(
      '',
    );
  });
  it('should add 2 new key/value tag and should trigger api call when form is submitted', async () => {
    //S
    const key1 = 'key1';
    const value1 = 'value1';
    const key2 = 'key2';
    const value2 = 'value2';
    const key3 = 'key3';
    const value3 = 'value3';
    const mockedRequestBodyInterceptor = jest.fn();
    server.use(
      rest.put(
        `${TEST_API_BASE_URL}/${OBJECT_METADATA.bucketName}/${OBJECT_METADATA.objectName}`,
        (req, res, ctx) => {
          if (req.url.searchParams.has('tagging')) {
            mockedRequestBodyInterceptor(req.body);
            return res(
              ctx.set({
                'x-amz-id-2': '845e54f5ea43aad26594',
                'x-amz-request-id': '845e54f5ea43aad26594',
                'x-amz-version-id':
                  '39383334363031303831373133363939393939395247303030303132342e34',
              }),
              ctx.status(200),
            );
          }
          return res(ctx.status(200));
        },
      ),
    );
    reduxRender(
      <Tags
        bucketName={OBJECT_METADATA.bucketName}
        objectKey={OBJECT_METADATA.objectKey}
        tags={[
          {
            key: key1,
            value: value1,
          },
        ]}
        versionId={OBJECT_METADATA.versionId}
      />,
      tagsConfig,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    userEvent.type(screen.getByRole('textbox', { name: 'Tag 2 key' }), key2);
    userEvent.type(
      screen.getByRole('textbox', { name: 'Tag 2 value' }),
      value2,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    userEvent.type(screen.getByRole('textbox', { name: 'Tag 3 key' }), key3);
    userEvent.type(
      screen.getByRole('textbox', { name: 'Tag 3 value' }),
      value3,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save Save' }));
    await waitFor(() =>
      expect(mockedRequestBodyInterceptor).toHaveBeenCalled(),
    );
    expect(mockedRequestBodyInterceptor).toHaveBeenCalledWith(
      expect.stringContaining(
        `<Tagging xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><TagSet><Tag><Key>${key1}</Key><Value>${value1}</Value></Tag><Tag><Key>${key2}</Key><Value>${value2}</Value></Tag><Tag><Key>${key3}</Key><Value>${value3}</Value></Tag></TagSet></Tagging>`,
      ),
    );
  });
  it('remove button and add button should be disabled by default', () => {
    reduxRender(
      <Tags
        bucketName={OBJECT_METADATA.bucketName}
        objectKey={OBJECT_METADATA.objectKey}
        tags={OBJECT_METADATA.tags}
        versionId={OBJECT_METADATA.versionId}
      />,
      tagsConfig,
    );

    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });
  it('should render an Item with key/value pass in props', () => {
    reduxRender(
      <Tags
        bucketName={OBJECT_METADATA.bucketName}
        objectKey={OBJECT_METADATA.objectKey}
        tags={[
          {
            key: 'key1',
            value: 'value1',
          },
        ]}
        versionId={OBJECT_METADATA.versionId}
      />,
      tagsConfig,
    );

    expect(screen.getByRole('textbox', { name: 'Tag 1 key' })).toHaveValue(
      'key1',
    );
    expect(screen.getByRole('textbox', { name: 'Tag 1 value' })).toHaveValue(
      'value1',
    );
  });
  it('should delete key/value if remove button is pressed', () => {
    reduxRender(
      <Tags
        bucketName={OBJECT_METADATA.bucketName}
        objectKey={OBJECT_METADATA.objectKey}
        tags={[
          {
            key: 'key1',
            value: 'value1',
          },
          {
            key: 'key2',
            value: 'value2',
          },
        ]}
        versionId={OBJECT_METADATA.versionId}
      />,
      tagsConfig,
    );

    expect(screen.getByRole('textbox', { name: 'Tag 1 key' })).toHaveValue(
      'key1',
    );
    expect(screen.getByRole('textbox', { name: 'Tag 1 value' })).toHaveValue(
      'value1',
    );

    expect(screen.getByRole('textbox', { name: 'Tag 2 key' })).toHaveValue(
      'key2',
    );
    expect(screen.getByRole('textbox', { name: 'Tag 2 value' })).toHaveValue(
      'value2',
    );

    expect(
      screen.getAllByRole('button', { name: 'Remove' })[0],
    ).not.toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Add' })[0],
    ).not.toBeDisabled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    expect(screen.getByRole('textbox', { name: 'Tag 1 key' })).toHaveValue(
      'key2',
    );
    expect(screen.getByRole('textbox', { name: 'Tag 1 value' })).toHaveValue(
      'value2',
    );
  });
});
