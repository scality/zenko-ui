import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { List } from 'immutable';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import * as s3object from '../../../actions/s3object';
import * as hooks from '../../../next-architecture/domain/business/buckets';
import { VEEAM_XML_PREFIX } from '../../../ISV/constants';
import * as queryHooks from '../../../utils/hooks';
import { LIST_OBJECTS_S3_TYPE } from '../../../utils/s3';
import {
  TEST_API_BASE_URL,
  reduxMount,
  reduxRender,
} from '../../../utils/testUtil';
import ObjectList from '../ObjectList';
import {
  FIRST_FORMATTED_OBJECT,
  NO_DATE_FORMATTED_OBJECT,
  SECOND_FORMATTED_OBJECT,
} from './utils/testUtil';

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
    jest.mock('react-router', () => {
      return {
        ...jest.requireActual('react-router'),
        useLocation: () => ({
          pathname: '/buckets/test/objects',
        }),
      };
    });
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });
  afterAll(() => server.close());
  it('should render ObjectList with no object', () => {
    reduxMount(
      //@ts-expect-error fix this when you are working on it
      <ObjectList
        objects={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );

    expect(screen.getByText('No Objects')).toBeInTheDocument();
  });
  it('should render ObjectList with objects', () => {
    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    const rows = component.getAllByRole('row');

    expect(rows).toHaveLength(2);

    expect(component.getByText('object1')).toBeInTheDocument();
    expect(component.getByText('2020-10-17 10:35:57')).toBeInTheDocument();
    expect(component.getByText('213 B')).toBeInTheDocument();
  });
  it('should call openObjectUploadModal by clicking on upload button', async () => {
    const openObjectUploadModalSpy = jest.spyOn(
      s3object,
      'openObjectUploadModal',
    );
    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );

    const uploadButton = component.getByRole('button', { name: /upload/i });
    await userEvent.click(uploadButton);
    expect(openObjectUploadModalSpy).toHaveBeenCalledTimes(1);
  });
  it('should call openFolderCreateModal by clicking on createFolder button', async () => {
    const openFolderCreateModalSpy = jest.spyOn(
      s3object,
      'openFolderCreateModal',
    );
    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    const createFolderButton = component.getByRole('button', {
      name: /folder/i,
    });
    await userEvent.click(createFolderButton);
    expect(openFolderCreateModalSpy).toHaveBeenCalledTimes(1);
  });
  it('Delete button should be disable if no object has been toggled', () => {
    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    const deleteButton = component.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeDisabled();
  });
  it('Delete button should be enable and should call openObjectDeleteModal when is pressed', async () => {
    const openObjectDeleteModalSpy = jest.spyOn(
      s3object,
      'openObjectDeleteModal',
    );
    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        //@ts-expect-error fix this when you are working on it
        toggled={List([FIRST_FORMATTED_OBJECT])}
      />,
    );
    const deleteButton = component.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeEnabled();
    await userEvent.click(deleteButton);
    expect(openObjectDeleteModalSpy).toHaveBeenCalledTimes(1);
  });
  it('should select all objects when ticking checkbox square', async () => {
    const toggleAllObjectsSpy = jest.spyOn(s3object, 'toggleAllObjects');
    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    const checkboxes = component.queryAllByRole('checkbox');
    await userEvent.click(checkboxes[1]);
    expect(toggleAllObjectsSpy).toHaveBeenCalledTimes(1);
  });
  it('one object should be selected and the other one not and should render all the details of each objects', () => {
    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );

    const rows = component.getAllByRole('row');
    expect(rows).toHaveLength(3);

    const checkboxes = component.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked();

    expect(component.getByText('object1')).toBeInTheDocument();
    expect(component.getByText('object2')).toBeInTheDocument();
    expect(component.getByText('2020-10-17 10:35:57')).toBeInTheDocument();
    expect(component.getByText('2020-10-17 16:35:57')).toBeInTheDocument();
    expect(component.getByText('213 B')).toBeInTheDocument();
    expect(component.getByText('120 KiB')).toBeInTheDocument();
  });
  it('should enable versioning toggle if versioning enabled', async () => {
    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
      />,
    );

    await waitFor(() => {
      const toggle = component.getByRole('checkbox', {
        name: /List Versions/i,
      });
      expect(toggle).toBeEnabled();
    });
  });
  it('should enable versioning toggle if versioning suspended', async () => {
    jest.spyOn(hooks, 'useBucketVersionning').mockReturnValue({
      versionning: { status: 'success', value: 'Suspended' },
    });
    jest
      .spyOn(queryHooks, 'useQueryParams')
      .mockReturnValueOnce(new URLSearchParams('?prefix=test'));

    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
      />,
    );
    await waitFor(() => {
      const toggle = component.getByRole('checkbox', {
        name: /List Versions/i,
      });
      expect(toggle).toBeEnabled();
    });
  });
  it('should disable versioning toggle if bucket versioning disabled', async () => {
    jest.spyOn(hooks, 'useBucketVersionning').mockReturnValue({
      versionning: { status: 'success', value: 'Disabled' },
    });
    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
      />,
    );

    await waitFor(() => {
      const toggle = component.getByRole('checkbox', {
        name: /List Versions/i,
      });
      expect(toggle).toBeEnabled();
    });
  });

  it('should disable versioning toggle if it is a veeam xml folder', async () => {
    jest.spyOn(hooks, 'useBucketVersionning').mockReturnValue({
      versionning: { status: 'success', value: 'Enabled' },
    });
    jest
      .spyOn(queryHooks, 'useQueryParams')
      .mockReturnValueOnce(
        new URLSearchParams(`?prefix=${VEEAM_XML_PREFIX}?showversions=true`),
      );

    const { component } = reduxMount(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
      />,
    );

    await waitFor(() => {
      const toggle = component.getByRole('checkbox', {
        name: /List Versions/i,
      });
      expect(toggle).toBeEnabled();
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
        //@ts-expect-error fix this when you are working on it
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
  it('should display empty cell when date and stroage location are undefined', async () => {
    reduxRender(
      <ObjectList
        //@ts-expect-error fix this when you are working on it
        objects={List([NO_DATE_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText(/object3/i)).toBeInTheDocument(),
    );
    expect(screen.getAllByLabelText(/Minus/)).toHaveLength(2);
  });
});
