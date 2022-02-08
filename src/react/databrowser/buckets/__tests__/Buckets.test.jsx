import router, { Redirect } from 'react-router';
import BucketDetails from '../BucketDetails';
import Header from '../../../ui-elements/EntityHeader';
import BucketList from '../BucketList';
import Buckets from '../Buckets';
import { List } from 'immutable';
import { MemoryRouter } from 'react-router-dom';
import { OWNER_NAME } from '../../../actions/__tests__/utils/testUtil';
import React from 'react';
import { reduxMount } from '../../../utils/test';

describe('Buckets', () => {
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

  it('should display EmptyStateContainer if no bucket is present', () => {
    jest.spyOn(router, 'useParams').mockReturnValue({ bucketName: '' });
    const { component } = reduxMount(<Buckets />);

    expect(component.find('Warning').prop('title')).toBe(
      'Create your first bucket.',
    );
  });

  it('should redirect to the first bucket if no bucket is selected', () => {
    jest.spyOn(router, 'useParams').mockReturnValue({ bucketName: '' });
    const { component } = reduxMount(
      <MemoryRouter>
        <Buckets />
      </MemoryRouter>,
      {
        s3: {
          listBucketsResults: {
            list: List(buckets),
            ownerName: OWNER_NAME,
          },
        },
      },
    );

    expect(component.find(Redirect)).toHaveLength(1);
  });

  it('should render the component', () => {
    jest.spyOn(router, 'useParams').mockReturnValue({ bucketName: 'bucket1' });
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

    expect(component.find(Header)).toHaveLength(1);
    expect(component.find(BucketList)).toHaveLength(1);
    expect(component.find(BucketDetails)).toHaveLength(1);
  });
});
