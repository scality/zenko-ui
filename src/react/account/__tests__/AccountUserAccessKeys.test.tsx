import { screen, within } from '@testing-library/react';
import IAMClient from '../../../js/IAMClient';
import * as IAMProviderModule from '../../IAMProvider';
import { mockOffsetSize, TEST_API_BASE_URL, testRender } from '../../utils/testUtil';
import AccountUserAccessKeys from '../AccountUserAccessKeys';

beforeAll(() => {
  mockOffsetSize(200, 100);
});
afterEach(() => jest.restoreAllMocks());

describe('AccountUserAccessKeys', () => {
  it('shows the loader in the table while the IAM client is not logged in yet', () => {
    jest.spyOn(IAMProviderModule, 'useIAMClient').mockReturnValue(new IAMClient(TEST_API_BASE_URL));

    testRender(<AccountUserAccessKeys />);

    expect(within(screen.getByRole('grid')).getByText('Loading access keys...')).toBeInTheDocument();
  });
});
