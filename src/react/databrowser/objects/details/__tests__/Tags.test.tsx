import * as s3objects from '../../../../actions/s3object';
import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import React from 'react';
import Tags from '../Tags';
import { reduxMount, reduxRender } from '../../../../utils/test';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('Tags should render', async () => {
    const { component } = reduxMount(<Tags objectMetadata={OBJECT_METADATA} />);
    expect(component.find(Tags).isEmptyRender()).toBe(false);
  });
  it('should render by default an Item with empty values in each input when there are no key/value present', () => {
     reduxRender(
      <Tags objectMetadata={OBJECT_METADATA} />
      , tagsConfig);

    expect(screen.getAllByRole('textbox', {name:''}  )[0]).toHaveValue('');
    expect(screen.getAllByRole('textbox', {name:''}  )[1]).toHaveValue('');

  });
  it('should add new key/value tag and should trigger function if save button is pressed', () => {
    reduxRender(
      <Tags
        objectMetadata={{
          ...OBJECT_METADATA,
          tags: [
            {
              key: 'key1',
              value: 'value1',
            },
            {
              key: '',
              value: '',
            }
          ],
        }}
      />
      , tagsConfig);

    fireEvent.click(screen.getAllByRole('button', {name:'Add'}  )[0]);
    userEvent.type(screen.getAllByRole('textbox', {name:''}  )[2], 'key2');
    userEvent.type(screen.getAllByRole('textbox', {name:''}  )[3], 'value2');
    fireEvent.click(screen.getByRole('button', {name:'Save'}  ));

    expect(screen.getAllByRole('textbox', {name:''}  )[2]).toHaveValue('key2');
    expect(screen.getAllByRole('textbox', {name:''}  )[3]).toHaveValue('value2');
  });
  it('remove button and add button should be disabled', () => {
    reduxRender(
      <Tags objectMetadata={OBJECT_METADATA} />
      , tagsConfig);

    expect(screen.getByRole('button', {name:'Remove'}  )).toBeDisabled();
    expect(screen.getByRole('button', {name:'Add'}  )).toBeDisabled();

  });
  it('should render an Item with key/value pass in props', () => {
    reduxRender(
      <Tags
        objectMetadata={{
          ...OBJECT_METADATA,
          tags: [
            {
              key: 'key1',
              value: 'value1',
            },
          ],
        }}
      />
      , tagsConfig);

    expect(screen.getAllByRole('textbox', {name:''}  )[0]).toHaveValue('key1');
    expect(screen.getAllByRole('textbox', {name:''}  )[1]).toHaveValue('value1');

  });
  it('should delete key/value if remove button is pressed', () => {
    reduxRender(
      <Tags
        objectMetadata={{
          ...OBJECT_METADATA,
          tags: [
            {
              key: 'key1',
              value: 'value1',
            },
            {
              key: 'key2',
              value: 'value2',
            }
          ],
        }}
      />
      , tagsConfig);

    expect(screen.getAllByRole('textbox', {name:''}  )[0]).toHaveValue('key1');
    expect(screen.getAllByRole('textbox', {name:''}  )[1]).toHaveValue('value1');

    expect(screen.getAllByRole('textbox', {name:''}  )[2]).toHaveValue('key2');
    expect(screen.getAllByRole('textbox', {name:''}  )[3]).toHaveValue('value2');

    expect(screen.getAllByRole('button', {name:'Remove'}  )[0]).not.toBeDisabled();
    expect(screen.getAllByRole('button', {name:'Add'}  )[0]).not.toBeDisabled();

    fireEvent.click(screen.getAllByRole('button', {name:'Remove'}  )[0]);

    expect(screen.getAllByRole('textbox', {name:''}  )[0]).toHaveValue('key2');
    expect(screen.getAllByRole('textbox', {name:''}  )[1]).toHaveValue('value2');

  });
});
