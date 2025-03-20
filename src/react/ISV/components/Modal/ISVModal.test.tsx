import { render, screen, waitFor } from '@testing-library/react';
import ISVModal from './ISVModal';
import { Wrapper } from '../../../utils/testUtil';
import { ISVList } from '../../ISVList';
import userEvent from '@testing-library/user-event';

describe('ISVModal', () => {
  it('should render', () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );

    expect(screen.getByText(/Select an ISV/)).toBeInTheDocument();
  });
  it('should display cards for every isv with documentation link and application name', () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );

    expect(screen.getByText(/Select an ISV/)).toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toHaveLength(ISVList.length);
    const links = screen.queryAllByRole('link');
    expect(links).toHaveLength(ISVList.length);

    ISVList.filter((isv) => isv.application).forEach((isv) => {
      expect(screen.queryByText(isv.application)).toBeInTheDocument();
    });
  });
  it('should change the selected ISV when clicking on a card', async () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );

    const firstCard = screen.getAllByRole('radio')[0];
    userEvent.click(firstCard);

    await waitFor(() => {
      expect(firstCard).toBeChecked();
    });
  });
  it('should display help message and change button label when selecting an assistant ISV', async () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );
    const commvaultCard = screen.getAllByRole('radio')[2];
    userEvent.click(commvaultCard);

    await waitFor(() => {
      expect(commvaultCard).toBeChecked();
    });

    expect(
      screen.getByText(
        /assistant will start to guide you through the configuration process./gi,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Commvault/gi)).toBeInTheDocument();
    expect(screen.getByText(/Continue to assistant/)).toBeInTheDocument();
  });
  it('should display help message and change button label when selecting a manual ISV', async () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );
    const manualCard = screen.getAllByRole('radio')[4];
    userEvent.click(manualCard);
    await waitFor(() => {
      expect(manualCard).toBeChecked();
    });
    expect(
      screen.getByText(/You will be redirected to the account page./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Rubrik/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue to create account/i)).toBeInTheDocument();
  });
  it('should allow keyboard navigation', async () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );
    const firstCard = screen.getAllByRole('radio')[0];

    userEvent.click(firstCard);

    await waitFor(() => {
      expect(firstCard).toBeChecked();
    });

    await userEvent.keyboard('{arrowdown}');
    const secondCard = screen.getAllByRole('radio')[1];
    await waitFor(() => {
      expect(secondCard).toBeChecked();
    });

    await userEvent.keyboard('{arrowup}');

    await waitFor(() => {
      expect(firstCard).toBeChecked();
    });
  });
});
