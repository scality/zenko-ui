import * as s3object from '../../../actions/s3object';
import { fireEvent } from '@testing-library/react';
import {
  BUCKET_INFO,
  FIRST_FORMATTED_OBJECT,
  SECOND_FORMATTED_OBJECT,
} from './utils/testUtil';
import { LIST_OBJECTS_S3_TYPE } from '../../../utils/s3';
import { mockOffsetSize, reduxRender } from '../../../utils/test';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import { List } from 'immutable';
import ObjectList from '../ObjectList';
import React from 'react';
import router from 'react-router';
import { ContainerWithSubHeader } from '../../../ui-elements/Table';
describe('ObjectList', () => {
  beforeAll(() => {
    jest.spyOn(router, 'useLocation').mockReturnValue({
      pathname: '/buckets/test/objects',
    });

    mockOffsetSize(200, 800);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should render ObjectList with no object', () => {
    const { component } = reduxRender(
      <ContainerWithSubHeader>
        <ObjectList
          objects={List()}
          bucketName={BUCKET_NAME}
          prefixWithSlash=""
          toggled={List()}
          bucketInfo={BUCKET_INFO}
        />
      </ContainerWithSubHeader>,
      {},
    );

    const rows = component
      .getAllByRole('rowgroup')[0]
      .getElementsByClassName('tr');

    expect(rows).toHaveLength(0);
  });
  it('should render ObjectList with objects', async () => {
    const { component } = reduxRender(
      <div style={{ width: '1024px', height: '10000px' }}>
        <ObjectList
          objects={List([FIRST_FORMATTED_OBJECT])}
          bucketName={BUCKET_NAME}
          prefixWithSlash=""
          toggled={List()}
          bucketInfo={BUCKET_INFO}
        />
      </div>,
      {},
    );

    const rows = component
      .getAllByRole('rowgroup')[0]
      .getElementsByClassName('tr');

    expect(rows).toHaveLength(1);
    expect(
      component.getByTitle('Toggle Row Selected').hasAttribute('checked'),
    ).toBe(false);
    expect(component.getByText('object1')).toBeInTheDocument();
    expect(component.getByText('Wed Oct 17 2020 10:35:57')).toBeInTheDocument();
    expect(component.getByText('213 B')).toBeInTheDocument();
  });

  it('should call openObjectUploadModal by clicking on upload button', () => {
    const openObjectUploadModalSpy = jest.spyOn(
      s3object,
      'openObjectUploadModal',
    );
    const { component } = reduxRender(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
      {},
    );
    fireEvent.click(
      component.getByRole('button', { name: 'Simple-upload Upload' }),
    );
    expect(openObjectUploadModalSpy).toHaveBeenCalledTimes(1);
  });

  it('should call openFolderCreateModal by clicking on createFolder button', () => {
    const openFolderCreateModalSpy = jest.spyOn(
      s3object,
      'openFolderCreateModal',
    );
    const { component } = reduxRender(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
      {},
    );

    fireEvent.click(
      component.getByRole('button', { name: 'Create-add Folder' }),
    );
    expect(openFolderCreateModalSpy).toHaveBeenCalledTimes(1);
  });

  it('Delete button should be disable if no object has been toggled', () => {
    const { component } = reduxRender(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
      {},
    );

    expect(
      component
        .getByRole('button', { name: 'Delete Delete' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });
  it('Delete button should be enable and should call openObjectDeleteModal when is pressed', () => {
    const openObjectDeleteModalSpy = jest.spyOn(
      s3object,
      'openObjectDeleteModal',
    );
    const { component } = reduxRender(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List([FIRST_FORMATTED_OBJECT])}
        bucketInfo={BUCKET_INFO}
      />,
      {},
    );
    const deleteButton = component.getByRole('button', {
      name: 'Delete Delete',
    });
    expect(deleteButton.hasAttribute('disabled')).toBe(false);
    fireEvent.click(deleteButton);
    expect(openObjectDeleteModalSpy).toHaveBeenCalledTimes(1);
  });

  it('should select all objects when ticking checkbox square', () => {
    const toggleAllObjectsSpy = jest.spyOn(s3object, 'toggleAllObjects');
    const { component } = reduxRender(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
      {},
    );

    const toggleAll = component.getByTitle('Toggle All Rows Selected');
    fireEvent.click(toggleAll);
    expect(toggleAllObjectsSpy).toHaveBeenCalledTimes(1);
  });

  it('should enable versioning toggle if versioning enabled', () => {
    const bucketInfo = {
      ...BUCKET_INFO,
      isVersioning: true,
      versioning: 'Enabled',
    };

    const { component } = reduxRender(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
        bucketInfo={bucketInfo}
      />,
      {},
    );

    expect(
      component.container
        .getElementsByClassName('sc-toggle')[0]
        .hasAttribute('disabled'),
    ).toBe(false);
  });
  it('should enable versioning toggle if versioning suspended', () => {
    const bucketInfo = {
      ...BUCKET_INFO,
      isVersioning: false,
      versioning: 'Suspended',
    };
    const { component } = reduxRender(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
        bucketInfo={bucketInfo}
      />,
      {},
    );
    expect(
      component.container
        .getElementsByClassName('sc-toggle')[0]
        .hasAttribute('disabled'),
    ).toBe(false);
  });
  it('should disable versioning toggle if bucket versioning disabled', () => {
    const { component } = reduxRender(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
        bucketInfo={BUCKET_INFO}
      />,
      {},
    );

    expect(
      component.container
        .getElementsByClassName('sc-toggle')[0]
        .hasAttribute('disabled'),
    ).toBe(true);
  });
});
