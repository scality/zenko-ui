import { METADATA_SYSTEM_TYPE, METADATA_USER_TYPE } from '../../../../utils';
import Metadata from '../Metadata';
import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
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

describe('Metadata', () => {
  const instanceId = 'instanceId';
  const accountId = 'accountId';

  const metadataConfig = {
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
  it('Metadata should render', () => {
    const { component } = reduxMount(
      <Metadata
        objectKey={OBJECT_METADATA.objectKey}
        bucketName={OBJECT_METADATA.bucketName}
        metadata={OBJECT_METADATA.metadata}
        listType={'s3'}
      />,
      {},
    );
    expect(component.find(Metadata).isEmptyRender()).toBe(false);
  });

  it('should enable save when value of a metadata changed', async () => {
    try {
      //S
      const metadataKey = 'CacheControl';
      const metadataValue = 'no-cache';
      const metadataNewValue = 'newvalue';
      const mockedRequestHeadersInterceptor = jest.fn();
      server.use(
        rest.put(
          `${TEST_API_BASE_URL}/${OBJECT_METADATA.bucketName}/${OBJECT_METADATA.objectName}`,
          (req, res, ctx) => {
            if (req.headers.get('x-amz-metadata-directive') === 'REPLACE') {
              mockedRequestHeadersInterceptor(req.headers.all());
              return res(
                ctx.set({
                  'x-amz-id-2': '845e54f5ea43aad26594',
                  'x-amz-request-id': '845e54f5ea43aad26594',
                  'x-amz-version-id':
                    '39383334363031303831373133363939393939395247303030303132342e34',
                }),
                ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
              <CopyObjectResult>
                <LastModified>2022-05-31T09:16:49.226Z</LastModified>
                <ETag>&quot;c116ba5a33b986bfd172375f0e6ce514&quot;</ETag>
              </CopyObjectResult>`),
              );
            }
            return res(ctx.status(200));
          },
        ),
      );

      const {
        component: { container },
      } = reduxRender(
        <Metadata
          objectKey={OBJECT_METADATA.objectKey}
          bucketName={OBJECT_METADATA.bucketName}
          metadata={[
            {
              key: metadataKey,
              value: metadataValue,
              type: METADATA_SYSTEM_TYPE,
            },
          ]}
          listType={'s3'}
        />,
        metadataConfig,
      );

      //V
      expect(
        container.getElementsByClassName('sc-select')[0].lastChild,
      ).toHaveValue(metadataKey);
      expect(
        screen.getByRole('textbox', { name: `${metadataKey} value` }),
      ).toHaveValue(metadataValue);
      expect(screen.getByRole('button', { name: 'Remove' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Add' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

      //E - change metadata value
      userEvent.type(
        screen.getByRole('textbox', { name: `${metadataKey} value` }),
        metadataNewValue,
      );
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
      //Submit the form
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() =>
        expect(mockedRequestHeadersInterceptor).toHaveBeenCalled(),
      );
      //V
      expect(mockedRequestHeadersInterceptor).toHaveBeenCalledWith(
        expect.objectContaining({
          'cache-control': metadataValue + metadataNewValue,
        }),
      );
    } catch (e) {
      console.log('should enable save when value of a metadata changed', e);
      throw e;
    }
  });

  it('should be possible to add a custom metadata', async () => {
    try {
      //S
      const metadataKey = 'CacheControl';
      const metadataValue = 'no-cache';
      const customMetadataKey = 'test';
      const customMetadataValue = 'newvalue';
      const mockedRequestHeadersInterceptor = jest.fn();
      server.use(
        rest.put(
          `${TEST_API_BASE_URL}/${OBJECT_METADATA.bucketName}/${OBJECT_METADATA.objectName}`,
          (req, res, ctx) => {
            if (req.headers.get('x-amz-metadata-directive') === 'REPLACE') {
              mockedRequestHeadersInterceptor(req.headers.all());
              return res(
                ctx.set({
                  'x-amz-id-2': '845e54f5ea43aad26594',
                  'x-amz-request-id': '845e54f5ea43aad26594',
                  'x-amz-version-id':
                    '39383334363031303831373133363939393939395247303030303132342e34',
                }),
                ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
              <CopyObjectResult>
                <LastModified>2022-05-31T09:16:49.226Z</LastModified>
                <ETag>&quot;c116ba5a33b986bfd172375f0e6ce514&quot;</ETag>
              </CopyObjectResult>`),
              );
            }
            return res(ctx.status(200));
          },
        ),
      );

      const {
        component: { container },
      } = reduxRender(
        <Metadata
          metadata={[
            {
              key: metadataKey,
              value: metadataValue,
              type: METADATA_SYSTEM_TYPE,
            },
          ]}
          objectKey={OBJECT_METADATA.objectKey}
          bucketName={OBJECT_METADATA.bucketName}
          listType={'s3'}
        />,
        metadataConfig,
      );

      //V
      expect(
        container.getElementsByClassName('sc-select')[0].lastChild,
      ).toHaveValue(metadataKey);
      expect(
        screen.getByRole('textbox', { name: `${metadataKey} value` }),
      ).toHaveValue(metadataValue);
      expect(screen.getByRole('button', { name: 'Remove' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Add' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

      //E - add a metadata
      await fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Custom metadata key' }),
        customMetadataKey,
      );
      await userEvent.type(
        screen.getByRole('textbox', { name: 'x-amz-meta value' }),
        customMetadataValue,
      );
      //Submit the form
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() =>
        expect(mockedRequestHeadersInterceptor).toHaveBeenCalled(),
      );
      //V
      expect(mockedRequestHeadersInterceptor).toHaveBeenCalledWith(
        expect.objectContaining({
          'cache-control': metadataValue,
          ['x-amz-meta-' + customMetadataKey]: customMetadataValue,
        }),
      );
    } catch (e) {
      console.log('should be possible to add a custom metadata', e);
      throw e;
    }
  });
  it('should disable inputs and buttons if versioning mode', () => {
    reduxRender(
      <Metadata
        listType="ver"
        bucketName={OBJECT_METADATA.bucketName}
        objectKey={OBJECT_METADATA.objectKey}
        metadata={[
          {
            key: 'CacheControl',
            value: 'no-cache',
            type: METADATA_SYSTEM_TYPE,
          },
        ]}
      />,
      metadataConfig,
    );

    expect(
      screen.getByRole('textbox', { name: 'CacheControl value' }),
    ).toHaveValue('no-cache');
    expect(
      screen.getByRole('textbox', { name: 'CacheControl value' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
  it('should delete key/value if remove button is pressed', async () => {
    try {
      const {
        component: { container },
      } = reduxRender(
        <Metadata
          listType="s3"
          metadata={[
            {
              key: 'CacheControl',
              value: 'no-cache',
              type: METADATA_SYSTEM_TYPE,
            },
            {
              key: 'cache-type',
              value: '1',
              type: METADATA_USER_TYPE,
            },
          ]}
          bucketName={OBJECT_METADATA.bucketName}
          objectKey={OBJECT_METADATA.objectKey}
        />,
        metadataConfig,
      );

      expect(
        container.getElementsByClassName('sc-select')[0].lastChild,
      ).toHaveValue('CacheControl');
      expect(
        screen.getByRole('textbox', { name: 'CacheControl value' }),
      ).toHaveValue('no-cache');

      expect(
        container.getElementsByClassName('sc-select')[1].lastChild,
      ).toHaveValue('x-amz-meta');
      expect(
        screen.getByRole('textbox', { name: 'x-amz-meta-cache-type value' }),
      ).toHaveValue('1');
      await fireEvent.click(
        screen.getAllByRole('button', { name: 'Remove' })[0],
      );
      expect(() =>
        screen.getByRole('textbox', { name: 'CacheControl value' }),
      ).toThrow();
    } catch (e) {
      console.log('should delete key/value if remove button is pressed', e);
      throw e;
    }
  });

  it('should have controls if the object has no metadata', () => {
    const { component } = reduxRender(
      <Metadata
        listType="s3"
        metadata={[]}
        bucketName={OBJECT_METADATA.bucketName}
        objectKey={OBJECT_METADATA.objectKey}
      />,
      metadataConfig,
    );

    expect(component.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(
      component.getByRole('button', { name: 'Remove' }),
    ).toBeInTheDocument();
  });
});
