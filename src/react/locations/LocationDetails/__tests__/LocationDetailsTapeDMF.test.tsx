import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { reduxRender } from '../../../utils/testUtil';
import LocationDetailsTapeDMF from '../LocationDetailsTapeDMF';

describe('LocationDetailsTapeDMF', () => {
  it('should trigger on change when endpoint change', async () => {
    //S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      nsId: '',
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    reduxRender(
      <LocationDetailsTapeDMF
        locationType="location-dmf-v1"
        details={sampleDetails}
        onChange={onChange}
      />,
      {},
    );

    //E
    await userEvent.type(screen.getByRole('textbox', { name: /endpoint/i }), 't');

    //V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: 't',
      nsId: '',
      password: '',
      repoId: [''],
      username: '',
    });
  });

  it('should trigger on change when namespaceId change', async () => {
    //S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      nsId: '',
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    reduxRender(
      <LocationDetailsTapeDMF
        locationType="location-dmf-v1"
        details={sampleDetails}
        onChange={onChange}
      />,
      {},
    );

    //E
    await userEvent.type(screen.getByRole('textbox', { name: /Namespace Id/i }), 't');

    //V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: '',
      nsId: 't',
      password: '',
      repoId: [''],
      username: '',
    });
  });

  it('should trigger on change when repoId change', async () => {
    //S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      nsId: '',
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    reduxRender(
      <LocationDetailsTapeDMF
        locationType="location-dmf-v1"
        details={sampleDetails}
        onChange={onChange}
      />,
      {},
    );

    //E
    await userEvent.type(screen.getByRole('textbox', { name: /RepoId\(s\)/i }), 't');

    //V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: '',
      nsId: '',
      password: '',
      repoId: ['t'],
      username: '',
    });
  });

  it('should first display disabled butons then when repoIds changed it should enable them', async () => {
    //S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      nsId: '',
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    reduxRender(
      <LocationDetailsTapeDMF
        locationType="location-dmf-v1"
        details={sampleDetails}
        onChange={onChange}
      />,
      {},
    );

    //V
    expect(screen.getByRole('button', { name: /Add/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Remove/i })).toBeDisabled();

    //E
    await userEvent.type(screen.getByRole('textbox', { name: /RepoId\(s\)/i }), 't');

    //V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: '',
      nsId: '',
      password: '',
      repoId: ['t'],
      username: '',
    });
    expect(screen.getByRole('button', { name: /Add/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Remove/i })).not.toBeDisabled();

    //E
    fireEvent.click(screen.getByRole('button', { name: /Add/i }));
    await userEvent.type(screen.getByRole('textbox', { name: /RepoId\(s\)/i }), 't');

    //V
    expect(screen.getAllByRole('button', { name: /Remove/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Add/i })).toHaveLength(1);

    //E
    fireEvent.click(screen.getAllByRole('button', { name: /Remove/i })[0]);

    //V
    expect(screen.getAllByRole('button', { name: /Remove/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /Add/i })).toHaveLength(1);
  });

  it('should trigger on change when username change', async () => {
    //S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      nsId: '',
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    reduxRender(
      <LocationDetailsTapeDMF
        locationType="location-dmf-v1"
        details={sampleDetails}
        onChange={onChange}
      />,
      {},
    );

    //E
    await userEvent.type(screen.getByRole('textbox', { name: /username/i }), 't');

    //V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: '',
      nsId: '',
      password: '',
      repoId: [''],
      username: 't',
    });
  });

  it('should trigger on change when password change', async () => {
    //S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      nsId: '',
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    reduxRender(
      <LocationDetailsTapeDMF
        locationType="location-dmf-v1"
        details={sampleDetails}
        onChange={onChange}
      />,
      {},
    );

    //E
    await userEvent.type(screen.getByLabelText(/password/i), 't');

    //V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: '',
      nsId: '',
      password: 't',
      repoId: [''],
      username: '',
    });
  });
});
