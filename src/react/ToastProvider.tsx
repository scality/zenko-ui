import { ErrorPage500 } from '@scality/core-ui';
import { ComponentWithFederatedImports } from '@scality/module-federation';
import { Node, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useIntl } from 'react-intl';
import { UseMutationResult } from 'react-query';

const toastGlobal = {};

export type MutationConfig<Data, Variables> = {
  mutation: UseMutationResult<Data, unknown, Variables, unknown>;
  name: string;
};

type DescriptionBuilder<Data> = {
  data?: Data;
  error?: unknown;
  name: string;
};

type MutationsHandlerProps<Data, Variables> = {
  mainMutation: MutationConfig<Data, Variables>;
  dependantMutations?: MutationConfig<Data, Variables>[];
  messageDescriptionBuilder: (
    successMutations: DescriptionBuilder<Data>[],
    errorMutations: DescriptionBuilder<Data>[],
  ) => ReactNode;
  toastStyles?: React.CSSProperties;
  onMainMutationSuccess?: () => void;
};

export function useToast() {
  return toastGlobal.hooks.useToast();
}

export function useMutationsHandler<Data, Variables>(
  mutationsHandlerProps: MutationsHandlerProps<Data, Variables>,
) {
  return toastGlobal.hooks2.useMutationsHandler(mutationsHandlerProps);
}

const InternalToastProvider = ({ moduleExports, children }) => {
  toastGlobal.hooks = moduleExports['./toast/useToast'];
  toastGlobal.hooks2 = moduleExports['./toast/useMutationsHandler'];
  return <>{children}</>;
};

function ErrorFallback() {
  const intl = useIntl();
  const language = intl.locale;
  return <ErrorPage500 locale={language} />;
}

export function ToastProvider({ children }: { children: Node }): Node {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ComponentWithFederatedImports
        componentWithInjectedImports={InternalToastProvider}
        renderOnError={<ErrorPage500 />}
        componentProps={{
          children,
        }}
        federatedImports={[
          {
            scope: 'shell',
            module: './toast/useToast',
            remoteEntryUrl: window.shellUIRemoteEntryUrl,
          },
          {
            scope: 'shell',
            module: './toast/useMutationsHandler',
            remoteEntryUrl: window.shellUIRemoteEntryUrl,
          },
        ]}
      />
    </ErrorBoundary>
  );
}
