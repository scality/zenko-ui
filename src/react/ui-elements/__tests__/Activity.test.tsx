import { render, screen } from '@testing-library/react';
import Activity, { DEFAULT_MESSAGE } from '../Activity';
import { Wrapper } from '../../utils/testUtil';

// TODO: Re-enable full tests after Activity component display conditions are confirmed
// Currently ACTIVITY_ENABLED = false in Activity.tsx
describe('Activity', () => {
  it('Activity is temporarily disabled via ACTIVITY_ENABLED flag', () => {
    render(<Activity />, { wrapper: Wrapper });
    expect(screen.queryByText(DEFAULT_MESSAGE)).not.toBeInTheDocument();
  });
});
