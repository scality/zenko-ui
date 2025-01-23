import { List } from 'immutable';
import router, { MemoryRouter, Navigate } from 'react-router';
import { ACCOUNT } from '../../../actions/__tests__/utils/testUtil';
import { reduxMount } from '../../../utils/testUtil';
import Buckets from '../Buckets';

describe.skip('Buckets', () => {
  const buckets = [
    {
      CreationDate: 'Wed Oct 07 2020 16:35:57',
      LocationConstraint: 'us-east-1',
      Name: 'bucket1',
    },
    {
      CreationDate: 'Wed Oct 07 2020 16:35:57',
      LocationConstraint: 'us-east-1',
      Name: 'bucket2',
    },
  ];
  beforeAll(() => {
    jest.spyOn(router, 'useLocation').mockReturnValue(
      //@ts-expect-error fix this when you are working on it
      {
        pathname: `/accounts/${ACCOUNT}/buckets`,
      },
    );
  });
  it('should display EmptyStateContainer if no bucket is present', () => {
    jest.spyOn(router, 'useParams').mockReturnValue({
      bucketName: '',
    });
    const { component } = reduxMount(<Buckets />);
    expect(
      component.getByText('Create your first bucket.'),
    ).toBeInTheDocument();
  });
  it('should redirect to the first bucket if no bucket is selected', () => {
    jest.spyOn(router, 'useParams').mockReturnValue({
      bucketName: '',
    });
    const { component } = reduxMount(
      <MemoryRouter>
        <Buckets />
      </MemoryRouter>,
      {
        s3: {
          listBucketsResults: {
            list: List(buckets),
          },
        },
      },
    );
    expect(component.container.querySelector('Navigate')).toBeInTheDocument();
  });
});
