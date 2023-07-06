import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MetadataSearch, { METADATA_SEARCH_HINT_ITEMS } from '../MetadataSearch';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import { renderWithRouterMatch } from '../../../utils/testUtil';

describe('Metadata Search', () => {
  const selectors = {
    input: () => screen.getByRole('textbox'),
    searchButton: () => screen.getByRole('button', { name: /search/i }),
  };

  it('should render MetadataSearch component', () => {
    renderWithRouterMatch(
      <MetadataSearch isMetadataType={false} errorZenkoMsg={null} />,
      {
        path: `/buckets/:bucketName/objects`,
        route: `/buckets/${BUCKET_NAME}/objects`,
      },
    );

    expect(selectors.input()).toBeInTheDocument();
    expect(selectors.input()).toBeEmptyDOMElement();
  });
  it('should render search button disabled by default', () => {
    renderWithRouterMatch(
      <MetadataSearch isMetadataType={false} errorZenkoMsg={null} />,
      {
        path: `/buckets/:bucketName/objects`,
        route: `/buckets/${BUCKET_NAME}/objects`,
      },
    );

    expect(selectors.searchButton()).toBeDisabled();
  });
  it('should render dropdown menu correctly', () => {
    renderWithRouterMatch(
      <MetadataSearch isMetadataType={false} errorZenkoMsg={null} />,
      {
        path: `/buckets/:bucketName/objects`,
        route: `/buckets/${BUCKET_NAME}/objects`,
      },
    );

    expect(selectors.input()).toBeInTheDocument();

    expect(screen.queryByText(/suggestions/i)).not.toBeInTheDocument();
    userEvent.click(selectors.input());

    expect(screen.getByText(/suggestions/i)).toBeInTheDocument();

    METADATA_SEARCH_HINT_ITEMS.forEach((h, index) => {
      expect(screen.getByText(h.descr)).toBeInTheDocument();
    });
  });
});
