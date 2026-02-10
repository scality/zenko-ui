import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewWrapper } from '../../utils/testUtil';
import { Clipboard } from '../Clipboard';

const OWNER_NAME = 'test-owner';

describe('Clipboard', () => {
  const writeTextFn = jest.fn();
  //@ts-expect-error fix this when you are working on it
  global.navigator.clipboard = {
    writeText: writeTextFn,
  };

  it('Clipboard should render with copy icon', () => {
    render(<Clipboard text={OWNER_NAME} />, { wrapper: NewWrapper() });
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('Clipboard should render with success icon', async () => {
    render(<Clipboard text={OWNER_NAME} />, { wrapper: NewWrapper() });

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await userEvent.click(copyButton);

    expect(writeTextFn).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });
});
