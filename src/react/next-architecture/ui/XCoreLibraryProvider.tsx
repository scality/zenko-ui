import { ErrorPage500 } from '@scality/core-ui/dist/components/error-pages/ErrorPage500.component';
import { ComponentWithFederatedImports } from '@scality/module-federation';
import { ErrorBoundary } from 'react-error-boundary';
import {
  useDeployedXcoreInstances,
  useXcoreBuildtimeConfig,
} from './ConfigProvider';

export const XCORE_NOT_AVAILABLE = 'XCore library is not available';
export class XCoreLibraryNotAvailable extends Error {
  constructor() {
    super(XCORE_NOT_AVAILABLE);
  }
}
const xcoreLibraryGlobal = {};
export function useXCoreLibrary() {
  //@ts-expect-error fix this when you are working on it
  if (xcoreLibraryGlobal.hooks) {
    //@ts-expect-error fix this when you are working on it
    return xcoreLibraryGlobal.hooks;
  }

  return new XCoreLibraryNotAvailable();
}

const InternalXcoreLibraryProvider = ({
  moduleExports,
  children,
}: {
  moduleExports: Record<string, never>;
  children: React.ReactNode;
}): React.ReactNode => {
  //@ts-expect-error fix this when you are working on it
  xcoreLibraryGlobal.hooks = moduleExports['./xcoreLibrary'];
  return <>{children}</>;
};

function ErrorFallback() {
  return <ErrorPage500 data-cy="sc-error-page500" locale={'en'} />;
}

export function XCoreLibraryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const xcoreWebfinger = useXcoreBuildtimeConfig();
  const instances = useDeployedXcoreInstances();
  const federatedImports = instances.map((instance) => {
    return {
      scope: xcoreWebfinger.spec.hooks.xcore_library.scope,
      module: xcoreWebfinger.spec.hooks.xcore_library.module,
      remoteEntryUrl: `${instance.url}${xcoreWebfinger.spec.remoteEntryPath}?version=${instance.version}`,
    };
  });

  if (!instances.length) {
    return <>{children}</>;
  } else {
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ComponentWithFederatedImports
          componentWithInjectedImports={InternalXcoreLibraryProvider}
          renderOnError={<ErrorPage500 />}
          componentProps={{
            children,
          }}
          federatedImports={federatedImports}
        />
      </ErrorBoundary>
    );
  }
}
