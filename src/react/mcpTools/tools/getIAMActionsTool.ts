import IAM from 'aws-sdk/clients/iam';
import { ToolContext } from '../types';

type ParamShape = { type: string; required: boolean };
type ActionShape = { required: string[]; params: Record<string, ParamShape> };

function buildIAMActions(): Record<string, ActionShape> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = (new IAM({ region: 'us-east-1' }) as any).api;
  const result: Record<string, ActionShape> = {};

  for (const [name, op] of Object.entries<any>(api.operations)) {
    const members: Record<string, any> = op.input?.members ?? {};
    const required: string[] = op.input?.required ?? [];
    result[name] = {
      required,
      params: Object.fromEntries(
        Object.entries(members).map(([param, shape]: [string, any]) => [
          param,
          { type: shape.type ?? 'string', required: required.includes(param) },
        ]),
      ),
    };
  }

  return result;
}

// Built once at module load — no need to recompute per call.
const IAM_ACTIONS = buildIAMActions();

export const getIAMActionsTool = {
  name: 'getIAMActions',
  description:
    'Lists every IAM action available on ARTESCA with its parameters and types. ' +
    'Use the action names with the executeIAMAction tool.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  execute: async (_params: { context: ToolContext }, _client: unknown) => {
    return IAM_ACTIONS;
  },
};
