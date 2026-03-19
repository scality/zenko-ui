import React from 'react';
import { testRender } from '../../utils/testUtil';
import { AccountHead } from '../AccountHead';

const accountNameTest = 'bart';

describe('AccountHead', () => {
  it('should render AccountHead component with the passed accountName', () => {
    const { component } = testRender(<AccountHead accountName={accountNameTest} />);

    expect(component.getByText(accountNameTest)).toHaveTextContent(accountNameTest);
  });
});
