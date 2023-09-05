import * as hooks from '../../../next-architecture/domain/business/buckets';
import * as s3object from '../../../actions/s3object';
import {
  FIRST_FORMATTED_OBJECT,
  SECOND_FORMATTED_OBJECT,
} from './utils/testUtil';
import { LIST_OBJECTS_S3_TYPE } from '../../../utils/s3';
import {
  TEST_API_BASE_URL,
  checkBox,
  reduxMount,
  reduxRender,
} from '../../../utils/testUtil';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import { List } from 'immutable';
import ObjectList from '../ObjectList';
import router from 'react-router';
import { screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
    if (req.url.searchParams.has('versioning')) {
      return res(
        ctx.status(200),
        ctx.xml(
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <VersioningConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/" />`,
        ),
      );
    }
  }),
);

describe('ObjectList', () => {
  beforeAll(() => {
    jest.spyOn(router, 'useLocation').mockReturnValue({
      pathname: '/buckets/test/objects',
    });
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });
  afterAll(() => server.close());
  it('should render ObjectList with no object', () => {
    const { component } = reduxMount(
      <ObjectList
        objects={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    expect(component.find('Row')).toHaveLength(0);
  });
  it('should render ObjectList with objects', () => {
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    const rows = component.find('Row');
    expect(rows).toHaveLength(1);
    const cells = rows.find('td').children();
    expect(cells.at(0).find('input').prop('checked')).toBe(false);
    expect(cells.at(1).prop('value')).toBe('object1');
    expect(cells.at(2).prop('value')).toBe('Wed Oct 17 2020 10:35:57');
    expect(cells.at(3).find('PrettyBytes').text()).toBe('213 B');
  });
  it('should call openObjectUploadModal by clicking on upload button', () => {
    const openObjectUploadModalSpy = jest.spyOn(
      s3object,
      'openObjectUploadModal',
    );
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    component.find('button#object-list-upload-button').simulate('click');
    expect(openObjectUploadModalSpy).toHaveBeenCalledTimes(1);
  });
  it('should call openFolderCreateModal by clicking on createFolder button', () => {
    const openFolderCreateModalSpy = jest.spyOn(
      s3object,
      'openFolderCreateModal',
    );
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    component.find('button#object-list-create-folder-button').simulate('click');
    expect(openFolderCreateModalSpy).toHaveBeenCalledTimes(1);
  });
  it('Delete button should be disable if no object has been toggled', () => {
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    expect(
      component.find('button#object-list-delete-button').prop('disabled'),
    ).toBe(true);
  });
  it('Delete button should be enable and should call openObjectDeleteModal when is pressed', () => {
    const openObjectDeleteModalSpy = jest.spyOn(
      s3object,
      'openObjectDeleteModal',
    );
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List([FIRST_FORMATTED_OBJECT])}
      />,
    );
    const deleteButton = component.find('button#object-list-delete-button');
    expect(deleteButton.prop('disabled')).toBe(false);
    deleteButton.simulate('click');
    expect(openObjectDeleteModalSpy).toHaveBeenCalledTimes(1);
  });
  it('should select all objects when ticking checkbox square', () => {
    const toggleAllObjectsSpy = jest.spyOn(s3object, 'toggleAllObjects');
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    checkBox(component, 'objectsHeaderCheckbox', true);
    expect(toggleAllObjectsSpy).toHaveBeenCalledTimes(1);
  });
  it('one object should be selected and the other one not and should render all the details of each objects', () => {
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    const rows = component.find('Row');
    expect(rows).toHaveLength(2);
    rows.forEach((row, index) => {
      const cells = row.find('td').children();
      expect(cells.at(0).find('input').prop('checked')).toBe(index !== 0);
      expect(cells.at(1).prop('value')).toBe(
        index === 0 ? 'object1' : 'object2',
      );
      expect(cells.at(2).prop('value')).toBe(
        index === 0 ? 'Wed Oct 17 2020 10:35:57' : 'Wed Oct 17 2020 16:35:57',
      );
      expect(cells.at(3).find('PrettyBytes').text()).toBe(
        index === 0 ? '213 B' : '120 KiB',
      );
    });
  });
  it('should enable versioning toggle if versioning enabled', async () => {
    jest.spyOn(hooks, 'useBucketVersionning').mockReturnValue({
      versionning: { status: 'success', value: 'Enabled' },
    });
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
      />,
    );
    await waitFor(() => {
      const toggle = component.find('ToggleSwitch#list-versions-toggle');
      expect(toggle.prop('disabled')).toBe(false);
    });
  });
  it('should enable versioning toggle if versioning suspended', async () => {
    jest.spyOn(hooks, 'useBucketVersionning').mockReturnValue({
      versionning: { status: 'success', value: 'Suspended' },
    });
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
      />,
    );
    await waitFor(() => {
      const toggle = component.find('ToggleSwitch#list-versions-toggle');
      expect(toggle.prop('disabled')).toBe(false);
    });
  });
  it('should disable versioning toggle if bucket versioning disabled', async () => {
    jest.spyOn(hooks, 'useBucketVersionning').mockReturnValue({
      versionning: { status: 'success', value: 'Disabled' },
    });
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
      />,
    );
    await waitFor(() => {
      component.update();
      const toggle = component.find('ToggleSwitch#list-versions-toggle');
      expect(toggle.prop('disabled')).toBe(true);
    });
  });

  it('should enable versioning toggle after updating bucket version', async () => {
    server.use(
      rest.get(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.xml(
            `<VersioningConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
                <Status>Enabled</Status>
              </VersioningConfiguration>`,
          ),
        );
      }),
    );

    reduxRender(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('List Versions')).toBeEnabled();
    });
  });
});
