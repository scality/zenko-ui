import { HeadCenter, HeadTitle } from '../../ui-elements/ListLayout';
import AccountHead from '../AccountHead';
import React from 'react';
import { reduxMount } from '../../utils/test';
import router from 'react-router';
const account1 = {
  arn: 'arn1',
  canonicalId: 'canonicalId1',
  createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  email: 'test@email1.com',
  id: '1',
  quotaMax: 1,
  Name: 'bart',
};
describe('AccountHead', () => {
  it('should render AccountHead component', () => {
    jest.spyOn(router, 'useParams').mockReturnValue({
      accountName: account1.Name,
    });
    const { component } = reduxMount(<AccountHead account={account1} />);
    expect(component.find(HeadCenter)).toHaveLength(1);
    expect(component.find(HeadTitle).text()).toContain(account1.Name);
    expect(component.find(HeadCenter)).toHaveLength(1);
  });
});
