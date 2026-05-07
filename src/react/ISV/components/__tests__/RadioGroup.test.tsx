import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { RadioGroup } from '../RadioGroup';

jest.mock('@scality/core-ui', () => ({
  ...jest.requireActual('@scality/core-ui'),
  Tooltip: ({ children, overlay }: { children: React.ReactNode; overlay: React.ReactNode }) => (
    <div>
      <div data-testid="tooltip-overlay">{overlay}</div>
      {children}
    </div>
  ),
}));

describe('RadioGroup', () => {
  const options = [
    { value: 'option1', label: 'Option 1', description: 'Description 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', description: 'Description 3' },
  ];

  const renderRadioGroup = (props = {}) => {
    const defaultProps = {
      options,
      value: 'option1',
      onChange: jest.fn(),
    };

    const mockTheme = {
      colors: {
        primary: '#0088cc',
        secondary: '#666',
        text: '#333',
      },
    } as any;

    return render(
      <ThemeProvider theme={mockTheme}>
        <RadioGroup {...defaultProps} {...props} />
      </ThemeProvider>,
    );
  };

  it('should render all radio options', () => {
    renderRadioGroup();

    expect(screen.getByRole('radio', { name: /Option 1/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Option 2/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Option 3/i })).toBeInTheDocument();
  });

  it('should render descriptions when provided', () => {
    renderRadioGroup();

    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 3')).toBeInTheDocument();
  });

  it('should check the selected option', () => {
    renderRadioGroup({ value: 'option2' });

    const option1 = screen.getByDisplayValue('option1');
    const option2 = screen.getByDisplayValue('option2');
    const option3 = screen.getByDisplayValue('option3');

    expect(option1).not.toBeChecked();
    expect(option2).toBeChecked();
    expect(option3).not.toBeChecked();
  });

  it('should call onChange when an option is selected', () => {
    const handleChange = jest.fn();
    renderRadioGroup({ onChange: handleChange });

    fireEvent.click(screen.getByLabelText('Option 2'));

    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  it('should render in horizontal direction when specified', () => {
    const { container } = renderRadioGroup({ direction: 'horizontal' });

    const radioGroupContainer = container.querySelector('div[direction="horizontal"]');
    expect(radioGroupContainer).toBeInTheDocument();
  });

  it('should disable all options when disabled prop is true', () => {
    renderRadioGroup({ disabled: true });

    const radioInputs = screen.getAllByRole('radio');
    radioInputs.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it('should render tooltip overlay text for disabled option with disabledReason', () => {
    const optionsWithDisabledReason = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true, disabledReason: 'This option is not available' },
    ];

    renderRadioGroup({ options: optionsWithDisabledReason });

    expect(screen.getByTestId('tooltip-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-overlay')).toHaveTextContent('This option is not available');
  });

  it('should not render tooltip for disabled option without disabledReason', () => {
    const optionsWithoutDisabledReason = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
    ];

    renderRadioGroup({ options: optionsWithoutDisabledReason });

    expect(screen.queryByTestId('tooltip-overlay')).not.toBeInTheDocument();
  });
});
