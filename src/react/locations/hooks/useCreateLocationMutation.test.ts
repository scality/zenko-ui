import { renderHook } from '@testing-library/react-hooks';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { INSTANCE_ID } from '../../../js/mock/managementClientMSWHandlers';
import { NewWrapper, TEST_API_BASE_URL } from '../../utils/testUtil';
import { useCreateLocationMutation } from './useCreateLocationMutation';

const LOCATION_URL = `${TEST_API_BASE_URL}/api/v1/config/${INSTANCE_ID}/location`;
const location = { name: 'crr-loc', locationType: 'location-scality-crr-v1', details: {} };

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useCreateLocationMutation', () => {
  it('creates the location in the configuration overlay', async () => {
    const received = jest.fn();
    server.use(
      rest.post(LOCATION_URL, (req, res, ctx) => {
        received(req.body);
        return res(ctx.status(200), ctx.json(location));
      }),
    );
    const { result, waitFor } = renderHook(() => useCreateLocationMutation(), { wrapper: NewWrapper() });

    // biome-ignore lint/suspicious/noExplicitAny: minimal location payload for the mutation under test
    result.current?.mutate(location as any);

    await waitFor(() => expect(result.current?.isSuccess).toBe(true));
    expect(received).toHaveBeenCalledWith(location);
  });

  it('surfaces the validation problem body when the overlay rejects the location with a 422', async () => {
    const problem = { message: 'a location with this name already exists' };
    server.use(rest.post(LOCATION_URL, (_req, res, ctx) => res(ctx.status(422), ctx.json(problem))));
    const { result, waitFor } = renderHook(() => useCreateLocationMutation(), { wrapper: NewWrapper() });

    // biome-ignore lint/suspicious/noExplicitAny: minimal location payload for the mutation under test
    result.current?.mutate(location as any);

    await waitFor(() => expect(result.current?.isError).toBe(true));
    expect(result.current?.error).toEqual(problem);
  });
});
