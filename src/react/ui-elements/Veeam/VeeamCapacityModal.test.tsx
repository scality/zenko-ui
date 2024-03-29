import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { bucketName } from '../../../js/mock/S3Client';
import { NewWrapper, TEST_API_BASE_URL } from '../../utils/testUtil';
import { VeeamCapacityModal } from './VeeamCapacityModal';
import { VEEAM_XML_PREFIX } from './VeeamConstants';

describe('VeeamCapacityModal', () => {
  const mockMutate = jest.fn();
  const server = setupServer(
    rest.put(
      `${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}/capacity.xml`,
      (req, res, ctx) => {
        mockMutate(req.body);
        return res(ctx.status(200));
      },
    ),
  );
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  const selectors = {
    modalTitle: () => screen.getByText('Edit max repository capacity'),
    editBtn: () => screen.getByLabelText('Edit max capacity'),
    cancelBtn: () => screen.getByText('Cancel'),
    editModalBtn: () => screen.getByLabelText('Update max capacity'),
    capacityInput: () =>
      screen.getByRole('spinbutton', { name: /Max Veeam Repository Capacity/ }),
  };

  beforeEach(() => {
    render(
      <VeeamCapacityModal
        bucketName={bucketName}
        maxCapacity={114748364800}
        status={'success'}
      />,
      {
        wrapper: NewWrapper(),
      },
    );
  });

  it('should render the modal', () => {
    fireEvent.click(selectors.editBtn());
    expect(selectors.modalTitle()).toBeInTheDocument();
  });

  it('should call mutate function when edit button is clicked', async () => {
    fireEvent.click(selectors.editBtn());
    fireEvent.change(selectors.capacityInput(), { target: { value: '200' } });

    await waitFor(async () => {
      expect(selectors.editModalBtn()).toBeEnabled();
    });
    fireEvent.click(selectors.editModalBtn());

    await waitFor(async () => {
      expect(mockMutate).toHaveBeenCalledWith(
        '<?xml version="1.0" encoding="utf-8" ?><CapacityInfo><Capacity>214748364800</Capacity><Available>0</Available><Used>0</Used></CapacityInfo>',
      );
    });
  });

  it('should display error toast if mutation failed', async () => {
    server.use(
      rest.put(
        `${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}/capacity.xml`,
        (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.xml(
              `<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><Resource></Resource><RequestId>a60426d7934a9fa05118</RequestId></Error>`,
            ),
          );
        },
      ),
    );
    fireEvent.click(selectors.editBtn());
    fireEvent.change(selectors.capacityInput(), { target: { value: '200' } });

    await waitFor(async () => {
      expect(selectors.editModalBtn()).toBeEnabled();
    });
    fireEvent.click(selectors.editModalBtn());

    await waitFor(async () => {
      expect(
        screen.getByText(
          'Failed to update repository capacity: The specified bucket does not exist.',
        ),
      ).toBeInTheDocument();
    });
  });
});
