import React from 'react';
import { AccountHead } from '../AccountHead';
import { reduxRender } from '../../utils/test';
const accountNameTest = 'bart';

describe('AccountHead', () => {
  it('should render AccountHead component with the passed accountName', () => {
    const { component } = reduxRender(
      <AccountHead accountName={accountNameTest} />,
      {},
    );

    expect(component.getByText(accountNameTest)).toHaveTextContent(
      accountNameTest,
    );
  });
});
