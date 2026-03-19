import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testRender } from '../../../utils/testUtil';
import LocationDetailsTapeMiria from '../LocationDetailsTapeMiria';

describe('LocationDetailsTapeMiria', () => {
  it('should trigger onChange when endpoint changes', async () => {
    // S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    testRender(
      <LocationDetailsTapeMiria locationType="location-miria-v1" details={sampleDetails} onChange={onChange} />,
    );

    // E
    await userEvent.type(screen.getByRole('textbox', { name: /endpoint/i }), 'ws://path.to.my.miria');

    // V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: 'ws://path.to.my.miria',
      repoId: [''],
      username: '',
      password: '',
    });
  });

  it('should trigger onChange when username changes', async () => {
    // S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    testRender(
      <LocationDetailsTapeMiria locationType="location-miria-v1" details={sampleDetails} onChange={onChange} />,
    );

    // E
    await userEvent.type(screen.getByRole('textbox', { name: /username/i }), 'testuser');

    // V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: '',
      repoId: [''],
      username: 'testuser',
      password: '',
    });
  });

  it('should trigger onChange when password changes', async () => {
    // S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    testRender(
      <LocationDetailsTapeMiria locationType="location-miria-v1" details={sampleDetails} onChange={onChange} />,
    );

    // E
    await userEvent.type(screen.getByLabelText(/password/i), 'testpassword');

    // V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: '',
      repoId: [''],
      username: '',
      password: 'testpassword',
    });
  });

  it('should trigger onChange when repoId changes', async () => {
    // S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      username: '',
      password: '',
    };
    const onChange = jest.fn();
    testRender(
      <LocationDetailsTapeMiria locationType="location-miria-v1" details={sampleDetails} onChange={onChange} />,
    );

    // E
    await userEvent.type(screen.getByRole('textbox', { name: /Atempo Miria Repository/i }), 'testRepo');

    // V
    expect(onChange).toHaveBeenCalledWith({
      endpoint: '',
      repoId: ['testRepo'],
      username: '',
      password: '',
    });
  });

  it('should show validation error for invalid endpoint', async () => {
    // S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      username: '',
      password: '',
    };
    testRender(
      <LocationDetailsTapeMiria locationType="location-miria-v1" details={sampleDetails} onChange={jest.fn()} />,
    );

    // E
    const endpointInput = screen.getByRole('textbox', { name: /endpoint/i });
    await userEvent.type(endpointInput, 'invalid-url');
    fireEvent.blur(endpointInput);

    // V
    expect(screen.getByText('Invalid endpoint URL format')).toBeInTheDocument();
  });

  it('should show validation error for empty required fields', async () => {
    // S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      username: '',
      password: '',
    };
    testRender(
      <LocationDetailsTapeMiria locationType="location-miria-v1" details={sampleDetails} onChange={jest.fn()} />,
    );

    // E - trigger validation by blurring fields
    const endpointInput = screen.getByRole('textbox', { name: /endpoint/i });
    const usernameInput = screen.getByRole('textbox', { name: /username/i });
    const repoIdInput = screen.getByRole('textbox', {
      name: /Atempo Miria Repository/i,
    });
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.blur(endpointInput);
    fireEvent.blur(usernameInput);
    fireEvent.blur(repoIdInput);
    fireEvent.blur(passwordInput);

    // V
    expect(screen.getByText('Endpoint is required')).toBeInTheDocument();
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('Atempo Miria Repository is required')).toBeInTheDocument();
  });

  it('should properly handle editing of existing location', () => {
    // S
    const sampleDetails = {
      endpoint: 'https://example.com',
      repoId: ['repo1'],
      username: 'user',
      password: 'hashedPassword',
      editingExisting: true,
    };
    testRender(
      <LocationDetailsTapeMiria
        locationType="location-miria-v1"
        details={sampleDetails}
        onChange={jest.fn()}
        editingExisting={true}
      />,
    );

    // V
    expect(screen.getByRole('textbox', { name: /endpoint/i })).toHaveValue('https://example.com');
    expect(screen.getByRole('textbox', { name: /username/i })).toHaveValue('user');
    expect(screen.getByRole('textbox', { name: /Atempo Miria Repository/i })).toHaveValue('repo1');
    // Password should be empty even if a hashed password was provided
    expect(screen.getByLabelText(/password/i)).toHaveValue('');
  });

  it('should require password for new location', async () => {
    // S
    const sampleDetails = {
      endpoint: 'https://example.com',
      repoId: ['repo1'],
      username: 'user',
      password: '',
      editingExisting: false,
    };
    const onChange = jest.fn();
    testRender(
      <LocationDetailsTapeMiria locationType="location-miria-v1" details={sampleDetails} onChange={onChange} />,
    );

    // E
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.blur(passwordInput);

    // V
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('should show temperature cold', async () => {
    // S
    const sampleDetails = {
      endpoint: '',
      repoId: [''],
      username: '',
      password: '',
    };

    testRender(
      <LocationDetailsTapeMiria locationType="location-miria-v1" details={sampleDetails} onChange={jest.fn()} />,
    );

    // V
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Cold')).toBeInTheDocument();
  });
});
