import * as s3objects from '../../../../actions/s3object';
import { METADATA_SYSTEM_TYPE, METADATA_USER_TYPE } from '../../../../utils';
import Metadata from '../Metadata';
import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import React from 'react';
import { reduxMount, reduxRender } from '../../../../utils/test';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
describe('Metadata', () => {
  const putObjectMetadataMock = jest
    .spyOn(s3objects, 'putObjectMetadata')
    .mockReturnValue({
      type: '',
    });
  const optionLabels = [
    'cache-control',
    'content-disposition',
    'content-encoding',
    'content-type',
    'website-redirect-location',
    'x-amz-meta',
    'content-language',
    'expires',
  ];
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
        access_token: ''
      }
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
      <Metadata objectMetadata={OBJECT_METADATA} />,
    );
    expect(component.find(Metadata).isEmptyRender()).toBe(false);
  });

  it('should add new key/value metadata and should trigger function if save button is pressed', () => {
    const { component: { container } }  = reduxRender(
      <Metadata
        objectMetadata={{
          ...OBJECT_METADATA,
          metadata: [
            {
              key: 'CacheControl',
              value: 'no-cache',
              type: METADATA_SYSTEM_TYPE,
            },
          ],
        }}
      />
      , metadataConfig);

    expect(container.getElementsByClassName('sc-select')[0].lastChild).toHaveValue('CacheControl');
    expect(screen.getByRole('textbox', {name:''}  )).toHaveValue('no-cache');
    expect(screen.getByRole('button', {name:'Remove'}  )).not.toBeDisabled();
    expect(screen.getByRole('button', {name:'Add'}  )).not.toBeDisabled();
    expect(screen.getByRole('button', {name:'Save'}  )).toBeDisabled();
    userEvent.type(screen.getByRole('textbox', {name:''}  ), 'newValue');
    userEvent.click(screen.getByRole('textbox', {name:'select'}  ));
    userEvent.type(screen.getByRole('textbox', {name:'select'}  ), 'newKey');
    expect(putObjectMetadataMock).toHaveBeenCalledTimes(0);
    expect(screen.getByRole('button', {name:'Save'}  )).not.toBeDisabled();
  //  fireEvent.click(screen.getByRole('button', {name:'Save'}  ));
    fireEvent.keyDown(screen.getAllByRole('button', {name:'Save'}  )[0]);
    expect(putObjectMetadataMock).toHaveBeenCalledTimes(0);
    expect(screen.getByRole('button', {name:'Add'}  )).not.toBeDisabled();
  });
  it('remove button and add button should be disabled', () => {
    reduxRender(
      <Metadata
        objectMetadata={{
          ...OBJECT_METADATA,
          metadata: [
            {
              key: 'CacheControl',
              value: 'no-cache',
              type: METADATA_SYSTEM_TYPE,
            },
          ],
        }}
      />
      , metadataConfig);

    expect(screen.getByRole('button', {name:'Remove'}  )).not.toBeDisabled();
    expect(screen.getByRole('button', {name:'Add'}  )).not.toBeDisabled();
  });
  it('should render SelectBox with key/value pass in props', () => {
    const { component: { container } }  = reduxRender(
      <Metadata
        objectMetadata={{
          ...OBJECT_METADATA,
          metadata: [
            {
              key: 'CacheControl',
              value: 'no-cache',
              type: METADATA_SYSTEM_TYPE,
            },
          ],
        }}
      />
      , metadataConfig);

    expect(screen.getByRole('textbox', {name:''}  ).id).toBe('mdValue');
    expect(screen.getByRole('textbox', {name:'select'}  )).toBeInTheDocument();
    expect(container.getElementsByClassName('sc-select')[0].lastChild).toHaveValue('CacheControl');
    expect(screen.getByRole('textbox', {name:''}  )).toHaveValue('no-cache');
    expect(screen.getByRole('button', {name:'Remove'}  )).not.toBeDisabled();
    expect(screen.getByRole('button', {name:'Add'}  )).not.toBeDisabled();
    expect(screen.getByRole('button', {name:'Save'}  )).toBeDisabled();
  });
  it('should disable inputs and buttons if versioning mode', () => {
    const { component: { container } }  = reduxRender(
      <Metadata
        objectMetadata={{
          ...OBJECT_METADATA,
          metadata: [
            {
              key: 'CacheControl',
              value: 'no-cache',
              type: METADATA_SYSTEM_TYPE,
            },
          ],
        }}
      />
      , metadataConfig);

    expect(screen.getByRole('textbox', {name:''}  ).id).toBe('mdValue');
    expect(screen.getByRole('textbox', {name:'select'}  )).toBeInTheDocument();
    expect(container.getElementsByClassName('sc-select')[0].lastChild).toHaveValue('CacheControl');
    expect(screen.getByRole('textbox', {name:''}  )).toHaveValue('no-cache');
    expect(screen.getByRole('button', {name:'Remove'}  )).not.toBeDisabled();
    expect(screen.getByRole('button', {name:'Add'}  )).not.toBeDisabled();
    expect(screen.getByRole('button', {name:'Save'}  )).toBeDisabled();

  });
  it('should delete key/value if remove button is pressed', () => {
    const { component: { container } }  = reduxRender(
      <Metadata
        objectMetadata={{
          ...OBJECT_METADATA,
          metadata: [
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
          ],
        }}
      />
      , metadataConfig);

    expect(screen.getAllByRole('textbox', {name:''}  )[0].id).toBe('mdValue');
    expect(screen.getAllByRole('textbox', {name:'select'}  )[0]).toBeInTheDocument();

    expect(container.getElementsByClassName('sc-select')[0].lastChild).toHaveValue('CacheControl');
    expect(screen.getAllByRole('textbox', {name:''}  )[0]).toHaveValue('no-cache');

    expect(container.getElementsByClassName('sc-select')[1].lastChild).toHaveValue('x-amz-meta');
    expect(screen.getAllByRole('textbox', {name:''}  )[1]).toHaveValue('cache-type');

    expect(screen.getAllByRole('textbox', {name:''}  )[2]).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', {name:'Remove'}  )[0]);
    expect(screen.getAllByRole('textbox', {name:''}  )[2]).toBe(undefined);
  });
});
