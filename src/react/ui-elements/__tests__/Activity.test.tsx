import { render, screen } from '@testing-library/react';
import { Wrapper } from '../../utils/testUtil';
import Activity, { DEFAULT_MESSAGE } from '../Activity';

// TODO: Re-enable full tests after Activity component display conditions are confirmed
// Currently ACTIVITY_ENABLED = false in Activity.tsx
describe('Activity', () => {
  it('Activity is temporarily disabled via ACTIVITY_ENABLED flag', () => {
    render(<Activity />, { wrapper: Wrapper });
    expect(screen.queryByText(DEFAULT_MESSAGE)).not.toBeInTheDocument();
  });
});
