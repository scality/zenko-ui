import {
  FIRST_FORMATTED_OBJECT,
  SECOND_FORMATTED_OBJECT,
} from './utils/testUtil';
import ObjectDetails, {
  MULTIPLE_ITEMS_SELECTED_MESSAGE,
  SELECT_AN_OBJECT_MESSAGE,
} from '../ObjectDetails';
import { List } from 'immutable';
import { OBJECT_METADATA } from '../../../actions/__tests__/utils/testUtil';
import { renderWithRouterMatch } from '../../../utils/testUtil';
import { screen } from '@testing-library/react';

const renderObjectDetails = (
  route = '/buckets/test/objects',
  list = List([FIRST_FORMATTED_OBJECT]),
  initialState = {},
) => {
  renderWithRouterMatch(
    //@ts-expect-error fix this when you are working on it
    <ObjectDetails toggled={list} />,
    {
      route: route,
      path: '/buckets/:bucketName/objects',
    },
    initialState,
  );
};

describe('ObjectDetails', () => {
  it('should display "Summary" tab when there is one toggled object', async () => {
    renderObjectDetails(undefined, undefined, {
      s3: {
        objectMetadata: OBJECT_METADATA,
      },
    });
    const labels = [
      'Name',
      'Version ID',
      'Size',
      'Modified On',
      'ETag',
      'Lock',
    ];
    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    expect(screen.getByText(OBJECT_METADATA.objectName)).toBeInTheDocument();
  });
  it('should display nothing in "Tags" tab when there is one toggled object', () => {
    renderObjectDetails('/buckets/test/objects?tab=tags', undefined, {
      s3: {
        objectMetadata: OBJECT_METADATA,
      },
    });
    expect(screen.getByText('Key')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });
  it('should display nothing in "Metadata" tab when there is one toggled object', () => {
    renderObjectDetails('/buckets/test/objects?tab=metadata', undefined, {
      s3: {
        objectMetadata: OBJECT_METADATA,
      },
    });

    expect(screen.getByText('Key')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });
  it(`should display "${MULTIPLE_ITEMS_SELECTED_MESSAGE}" message in "Summary" tab when there are more than one toggled object`, async () => {
    renderObjectDetails(
      undefined,
      List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT]),
    );

    expect(
      screen.getByText(MULTIPLE_ITEMS_SELECTED_MESSAGE),
    ).toBeInTheDocument();
  });
  it(`should display "${MULTIPLE_ITEMS_SELECTED_MESSAGE}" message in "Tabs" tab when there are more than one toggled object`, () => {
    renderObjectDetails(
      '/buckets/test/objects?tab=tags',
      List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT]),
    );

    expect(
      screen.getByText(MULTIPLE_ITEMS_SELECTED_MESSAGE),
    ).toBeInTheDocument();
  });
  it(`should display "${MULTIPLE_ITEMS_SELECTED_MESSAGE}" message in "Metadata" tab when there are more than one toggled object`, () => {
    renderObjectDetails(
      '/buckets/test/objects?tab=metadata',
      List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT]),
    );

    expect(
      screen.getByText(MULTIPLE_ITEMS_SELECTED_MESSAGE),
    ).toBeInTheDocument();
  });
  it(`should display "${SELECT_AN_OBJECT_MESSAGE}" message in "Summary" tab if no object has been toggled`, async () => {
    renderObjectDetails('/buckets/test/objects', List());
    expect(screen.getByText(SELECT_AN_OBJECT_MESSAGE)).toBeInTheDocument();
  });

  it(`should display "${SELECT_AN_OBJECT_MESSAGE}" message in "Tabs" tab if no object has been toggled`, () => {
    renderObjectDetails('/buckets/test/objects?tab=tags', List());
    expect(screen.getByText(SELECT_AN_OBJECT_MESSAGE)).toBeInTheDocument();
  });

  it(`should display "${SELECT_AN_OBJECT_MESSAGE}" message in "Metadata" tab if no object has been toggled`, () => {
    renderObjectDetails('/buckets/test/objects?tab=metadata', List());
    expect(screen.getByText(SELECT_AN_OBJECT_MESSAGE)).toBeInTheDocument();
  });
});
