import { useMutation } from 'react-query';
import { postJSON } from './crrFetch';
import type { VerifyRequestBody, VerifyResponse } from './types';

// react-query mutation that POSTs the wizard's verify payload to
// `/crr-configurator/api/v1/verify` and yields the mode-specific
// response. Errors surface as `Error` — cast to `ServiceError` at
// the caller to read `.problem.code`.
export const useCRRConfigurationVerifyMutation = () =>
  useMutation<VerifyResponse, Error, VerifyRequestBody>({
    mutationFn: (body) => postJSON<VerifyRequestBody, VerifyResponse>('/verify', body),
  });
