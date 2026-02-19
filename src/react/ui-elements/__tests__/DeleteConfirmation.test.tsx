import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewWrapper } from '../../utils/testUtil';
import DeleteConfirmation from '../DeleteConfirmation';

describe('DeleteConfirmation', () => {
  const TITLE_TEXT = 'Are you sure you want to delete bucket: test ?';
  const approveFn = jest.fn();
  const cancelFn = jest.fn();

  it('DeleteConfirmation should render', () => {
    render(<DeleteConfirmation approve={approveFn} cancel={cancelFn} show={true} titleText={TITLE_TEXT} />, {
      wrapper: NewWrapper(),
    });
    expect(screen.getByText(TITLE_TEXT)).toBeInTheDocument();
  });

  it('DeleteConfirmation should not render', () => {
    render(<DeleteConfirmation approve={approveFn} cancel={cancelFn} show={false} titleText={TITLE_TEXT} />, {
      wrapper: NewWrapper(),
    });
    expect(screen.queryByText(TITLE_TEXT)).not.toBeInTheDocument();
  });

  it('should call approve function after clicking on delete button', async () => {
    render(<DeleteConfirmation approve={approveFn} cancel={cancelFn} show={true} titleText={TITLE_TEXT} />, {
      wrapper: NewWrapper(),
    });
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(approveFn).toHaveBeenCalledTimes(1);
  });

  it('should call cancel function after clicking on cancel button', async () => {
    render(<DeleteConfirmation approve={approveFn} cancel={cancelFn} show={true} titleText={TITLE_TEXT} />, {
      wrapper: NewWrapper(),
    });
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(cancelFn).toHaveBeenCalledTimes(1);
  });
});
