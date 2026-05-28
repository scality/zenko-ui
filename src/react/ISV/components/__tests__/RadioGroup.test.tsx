import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { RadioGroup } from '../RadioGroup';

jest.mock('@scality/core-ui', () => ({
  Tooltip: ({ children, overlay }: { children: React.ReactNode; overlay: React.ReactNode }) => (
    <>
      {children}
      {overlay}
    </>
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

  it('renders all options with their labels', () => {
    renderRadioGroup();

    expect(screen.getByRole('radio', { name: /Option 1/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Option 2/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Option 3/i })).toBeInTheDocument();
  });

  it('renders descriptions alongside their options', () => {
    renderRadioGroup();

    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 3')).toBeInTheDocument();
  });

  it('marks only the selected option as checked', () => {
    renderRadioGroup({ value: 'option2' });

    expect(screen.getByDisplayValue('option1')).not.toBeChecked();
    expect(screen.getByDisplayValue('option2')).toBeChecked();
    expect(screen.getByDisplayValue('option3')).not.toBeChecked();
  });

  it('calls onChange with the selected value when an option is clicked', () => {
    const handleChange = jest.fn();
    renderRadioGroup({ onChange: handleChange });

    fireEvent.click(screen.getByLabelText('Option 2'));

    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  it('disables all inputs when the group-level disabled prop is set', () => {
    renderRadioGroup({ disabled: true });

    screen.getAllByRole('radio').forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it('shows the explanation text when a disabled option has a disabledReason', () => {
    const optionsWithReason = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true, disabledReason: 'This option is unavailable' },
    ];
    renderRadioGroup({ options: optionsWithReason });

    expect(screen.getByText('This option is unavailable')).toBeInTheDocument();
  });

  it('shows no extra explanation text when a disabled option has no disabledReason', () => {
    const optionsNoReason = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
    ];
    renderRadioGroup({ options: optionsNoReason });

    expect(screen.queryByText('This option is unavailable')).not.toBeInTheDocument();
  });

  it('does not show disabledReason for an enabled option', () => {
    const optionsEnabledWithReason = [
      { value: 'option1', label: 'Option 1', disabledReason: 'Should not appear' },
    ];
    renderRadioGroup({ options: optionsEnabledWithReason });

    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });
});
