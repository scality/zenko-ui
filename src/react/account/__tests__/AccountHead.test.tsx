import React from 'react';
import { AccountHead } from '../AccountHead';
import { testRender } from '../../utils/testUtil';
const accountNameTest = 'bart';

describe('AccountHead', () => {
  it('should render AccountHead component with the passed accountName', () => {
    const { component } = testRender(
      <AccountHead accountName={accountNameTest} />,
    );

    expect(component.getByText(accountNameTest)).toHaveTextContent(
      accountNameTest,
    );
  });
});
