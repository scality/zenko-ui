import { screen } from '@testing-library/react';
import { reduxRender } from '../../../utils/test';
import { PauseAndResume } from '../PauseAndResume';

describe('PauseAndResume', () => {
  it('should render the component with pause label when ingestion is enabled', () => {
    reduxRender(
      <PauseAndResume
        locationName="someLocation"
        ingestionStates={{ ['someLocation']: 'enabled' }}
        replicationStates={null}
        dispatch={() => ({})}
        invalidateInstanceStatusQueryCache={() => ({})}
        loading={false}
      />,
      {},
    );

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).not.toBeDisabled();
  });

  it('should render the component with pause label when replication is enabled', () => {
    reduxRender(
      <PauseAndResume
        locationName="someLocation"
        ingestionStates={null}
        replicationStates={{ ['someLocation']: 'enabled' }}
        dispatch={() => ({})}
        invalidateInstanceStatusQueryCache={() => ({})}
        loading={false}
      />,
      {},
    );

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).not.toBeDisabled();
  });

  it('should render the component with pause label when both replication and ingestion are enabled', () => {
    reduxRender(
      <PauseAndResume
        locationName="someLocation"
        ingestionStates={{ ['someLocation']: 'enabled' }}
        replicationStates={{ ['someLocation']: 'enabled' }}
        dispatch={() => ({})}
        invalidateInstanceStatusQueryCache={() => ({})}
        loading={false}
      />,
      {},
    );

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).not.toBeDisabled();
  });

  it('should render the component with resume label when ingestion is disabled', () => {
    reduxRender(
      <PauseAndResume
        locationName="someLocation"
        ingestionStates={{ ['someLocation']: 'disabled' }}
        replicationStates={null}
        dispatch={() => ({})}
        invalidateInstanceStatusQueryCache={() => ({})}
        loading={false}
      />,
      {},
    );

    expect(screen.getByRole('button', { name: /Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resume/i })).not.toBeDisabled();
  });

  it('should render the component with resume label when replication is disabled', () => {
    reduxRender(
      <PauseAndResume
        locationName="someLocation"
        ingestionStates={null}
        replicationStates={{ ['someLocation']: 'disabled' }}
        dispatch={() => ({})}
        invalidateInstanceStatusQueryCache={() => ({})}
        loading={false}
      />,
      {},
    );

    expect(screen.getByRole('button', { name: /Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resume/i })).not.toBeDisabled();
  });

  it('should render the component with pause label when one of the two processes are enabled (while loading/processing an action)', () => {
    reduxRender(
      <PauseAndResume
        locationName="someLocation"
        ingestionStates={{ ['someLocation']: 'enabled' }}
        replicationStates={{ ['someLocation']: 'disabled' }}
        dispatch={() => ({})}
        invalidateInstanceStatusQueryCache={() => ({})}
        loading={true}
      />,
      {},
    );

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).toBeDisabled();
  });

  it('should render a disabled component when loading', () => {
    reduxRender(
      <PauseAndResume
        locationName="someLocation"
        ingestionStates={{ ['someLocation']: 'enabled' }}
        replicationStates={null}
        dispatch={() => ({})}
        invalidateInstanceStatusQueryCache={() => ({})}
        loading={true}
      />,
      {},
    );

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).toBeDisabled();
  });
});
