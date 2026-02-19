/* eslint-disable */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { debug } from 'jest-preview';
import { themeMount as mount, NewWrapper } from '../../../utils/testUtil';
import LocationDetailsNFS from '../LocationDetailsNFS';

const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsNFS />', () => {
  it('should correctly translate location details to state values', () => {
    render(
      <LocationDetailsNFS
        locationType={'location-file-v1'}
        {...props}
        details={{
          endpoint: 'tcp+v3://ep/export/path?hard&async',
        }}
      />,
      { wrapper: NewWrapper() },
    );

    debug();

    // Vérifiez que les valeurs traduites apparaissent correctement dans le DOM
    expect(screen.getByLabelText(/protocol/i));
    expect(screen.getByLabelText(/version/i));
    expect(screen.getByLabelText(/server/i));
    expect(screen.getByLabelText(/path/i));
    expect(screen.getByLabelText(/options/i));
  });
  it('should correctly translate state values to location details', async () => {
    const onChangeFn = jest.fn();
    render(<LocationDetailsNFS locationType={'location-file-v1'} {...props} onChange={onChangeFn} />, {
      wrapper: NewWrapper(),
    });

    // Simuler les interactions ou les changements nécessaires pour atteindre l'état
    userEvent.type(screen.getByLabelText(/server/i), 'ep');
    userEvent.type(screen.getByLabelText(/path/i), '/export/test/path');
    userEvent.type(screen.getByLabelText(/options/i), 'soft&sync');

    // Assurez-vous que `onChangeFn` est appelé avec les bons arguments
    expect(onChangeFn).toHaveBeenCalled();
  });
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    //@ts-expect-error fix this when you are working on it
    mount(<LocationDetailsNFS {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      endpoint: 'tcp+v3://',
    });
  });
  it('should call onChange on state update', async () => {
    const _refLocation = {
      endpoint: 'tcp+v3://ep/export/path?hard&async',
    };
    const onChangeFn = jest.fn();
    const _component = render(
      <LocationDetailsNFS locationType={'location-file-v1'} {...props} onChange={onChangeFn} />,
      { wrapper: NewWrapper() },
    );

    await userEvent.type(screen.getByLabelText(/server/i), 'ep');
    await userEvent.type(screen.getByLabelText(/path/i), '/export/path');
    await userEvent.type(screen.getByLabelText(/options/i), 'hard&async');

    expect(onChangeFn).toHaveBeenCalled();
  });
  it('should show NFS details for empty details', () => {
    render(<LocationDetailsNFS locationType={'location-file-v1'} {...props} />, { wrapper: NewWrapper() });

    expect(screen.getByLabelText(/protocol/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/version/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/server/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/options/i)).toBeInTheDocument();

    const inputs = screen.getAllByRole('textbox');
    // biome-ignore lint/suspicious/useIterableCallbackReturn: intentional
    inputs.forEach((input) => expect(input).toBeEnabled());
  });
  it('should show NFS details when editing an existing location', () => {
    const locationDetails = {
      endpoint: 'tcp+v3://ep/export/path?hard&async',
    };
    render(
      <LocationDetailsNFS locationType={'location-file-v1'} {...props} editingExisting details={locationDetails} />,
      { wrapper: NewWrapper() },
    );

    expect(screen.getByLabelText(/protocol/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/version/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/server/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/options/i)).toBeInTheDocument();

    const inputs = screen.getAllByRole('textbox');
    // biome-ignore lint/suspicious/useIterableCallbackReturn: intentional
    inputs.forEach((input) => expect(input).toBeDisabled());
  });
  it('should call onChange on location details updates', async () => {
    const refLocation = {
      endpoint: 'tcp+v3://ep/export/path?hard&async',
    };
    let location = {};
    render(
      <LocationDetailsNFS
        {...props}
        // biome-ignore lint/suspicious/noAssignInExpressions: test re-render pattern
        onChange={(l) => (location = l)}
        // @ts-expect-error - FIX ME LATER
        value="udp"
      />,
      { wrapper: NewWrapper() },
    );

    await userEvent.type(screen.getByLabelText(/server/i), 'ep');
    await userEvent.type(screen.getByLabelText(/path/i), '/export/path');
    await userEvent.type(screen.getByLabelText(/options/i), 'hard&async');

    expect(location).toEqual(refLocation);
  });
});
