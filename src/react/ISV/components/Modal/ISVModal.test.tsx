import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Wrapper } from '../../../utils/testUtil';
import { ISVList } from '../../ISVList';
import ISVModal from './ISVModal';

jest.mock('../../hooks/useCheckSOSAPIStatus', () => ({
  useCheckSOSAPIStatus: jest.fn().mockReturnValue('activated'),
}));

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
    const assistantISV = ISVList.find((isv) => isv.assistant);
    const commvaultCard = document.getElementById(`isv-${assistantISV.name}`) as HTMLInputElement;
    userEvent.click(commvaultCard);

    await waitFor(() => {
      expect(commvaultCard).toBeChecked();
    });

    expect(
      screen.getByText(/assistant will start to guide you through the configuration process./gi),
    ).toBeInTheDocument();
    expect(screen.getByText(/Continue to assistant/)).toBeInTheDocument();
  });
  it('should display help message and change button label when selecting a manual ISV', async () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );
    const manualISV = ISVList.find((isv) => !isv.assistant);
    const manualCard = document.getElementById(`isv-${manualISV.name}`) as HTMLInputElement;
    userEvent.click(manualCard);
    await waitFor(() => {
      expect(manualCard).toBeChecked();
    });
    expect(screen.getByText(/You will be redirected to the account page./i)).toBeInTheDocument();
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
  it('should render the AI category with its cards', () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );

    expect(screen.getByText('AI Solutions')).toBeInTheDocument();
    expect(screen.getByText('MLflow')).toBeInTheDocument();
    expect(screen.getByText('Weaviate')).toBeInTheDocument();

    const aiISVs = ISVList.filter((isv) => isv.category === 'ai-solutions');
    expect(aiISVs).toHaveLength(17);
    aiISVs.forEach((isv) => {
      expect(document.getElementById(`isv-${isv.name}`)).toHaveAttribute('type', 'radio');
    });
  });
  it('should display an Auto or Manual badge on each card', () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );

    const assistantISV = ISVList.find((isv) => isv.assistant);
    const veeamCard = document.getElementById(`isv-${assistantISV.name}`).closest('label').parentElement;
    expect(within(veeamCard).getByText('With assistant')).toBeInTheDocument();

    const mlflowCard = document.getElementById('isv-MLflow').closest('label').parentElement;
    expect(within(mlflowCard).queryByText('With assistant')).not.toBeInTheDocument();

    const assistantCount = ISVList.filter((isv) => isv.assistant).length;
    expect(screen.getAllByText('With assistant')).toHaveLength(assistantCount);
    expect(screen.queryByText('Manual')).not.toBeInTheDocument();
    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
  });
  it('should filter the cards with the search input and restore them when cleared', async () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );

    const searchInput = screen.getByLabelText('Search ISV');
    await userEvent.type(searchInput, 'mlflow');

    await waitFor(
      () => {
        expect(screen.queryAllByRole('radio')).toHaveLength(1);
      },
      { timeout: 5000 },
    );
    expect(screen.getByText('MLflow')).toBeInTheDocument();
    expect(screen.queryByText('Backup and Archive Solutions')).not.toBeInTheDocument();
    ISVList.filter((isv) => isv.category === 'backup-and-archive').forEach((isv) => {
      expect(document.getElementById(`isv-${isv.name}`)).not.toBeInTheDocument();
    });

    await userEvent.clear(searchInput);

    await waitFor(
      () => {
        expect(screen.queryAllByRole('radio')).toHaveLength(ISVList.length);
      },
      { timeout: 5000 },
    );
    expect(screen.getByText('Backup and Archive Solutions')).toBeInTheDocument();
  });
  it('should render the name of an ISV without a logo', () => {
    render(
      <Wrapper>
        <ISVModal isOpen={true} setIsOpen={() => {}} />
      </Wrapper>,
    );

    expect(screen.getByText('Bodo.ai')).toBeVisible();
  });
});
