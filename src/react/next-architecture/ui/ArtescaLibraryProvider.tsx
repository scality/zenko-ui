import { ErrorPage500 } from '@scality/core-ui/dist/components/error-pages/ErrorPage500.component';
import * as ModuleFederation from '@scality/module-federation';
import { ErrorBoundary } from 'react-error-boundary';
export type ArtescaLibraryHooks = {
  useArtescaPlusVeeamDefaultOrOpenMode: () => {
    artescaPlusVeeamDefaultOrOpenMode: 'default' | 'open' | null;
    artescaPlusVeeamDefaultOrOpenModeStatus: 'loading' | 'error' | 'success';
  };
  ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME: string;
};
export const ARTESCA_LIBRARY_NOT_AVAILABLE = 'Artesca library is not available';

export const TOOLTIP_ARTESCA_PLUS_VEEAM_DEFAULT_MODE = `This action is disabled in the default ARTESCA + Veeam deployment due to enforced security settings. 
              Please refer to the documentation to enable this functionality.`;
export class ArtescaLibraryNotAvailable extends Error {
  constructor() {
    super(ARTESCA_LIBRARY_NOT_AVAILABLE);
  }
}
const artescaLibraryGlobal: { hooks: ArtescaLibraryHooks } = {
  hooks: undefined,
};

export function useArtescaLibrary() {
  if (artescaLibraryGlobal.hooks) {
    return artescaLibraryGlobal.hooks;
  }

  return new ArtescaLibraryNotAvailable();
}

const InternalArtescaLibraryProvider = ({
  moduleExports,
  children,
}: {
  moduleExports: Record<string, never>;
  children: React.ReactNode;
}) => {
  artescaLibraryGlobal.hooks = moduleExports['./hooks/artescaLibrary'];
  return <>{children}</>;
};

function ErrorFallback() {
  return <ErrorPage500 data-cy="sc-error-page500" locale={'en'} />;
}

export function ArtescaLibraryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { useDeployedApps } = ModuleFederation.useShellHooks();
  const instances = useDeployedApps({ kind: 'artesca-base-ui' });

  const { useConfig } = ModuleFederation.useShellHooks();

  const artescaWebfinger = useConfig({
    configType: 'build',
    name: instances?.[0]?.name || '',
  });

  if (!instances.length) {
    return <>{children}</>;
  } else {
    const federatedImports = instances.map((instance) => {
      return {
        scope: artescaWebfinger.spec.hooks.artescaLibrary.scope,
        module: artescaWebfinger.spec.hooks.artescaLibrary.module,
        remoteEntryUrl: `${instance.url}${artescaWebfinger.spec.remoteEntryPath}?version=${instance.version}`,
      };
    });
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ModuleFederation.ComponentWithFederatedImports
          componentWithInjectedImports={InternalArtescaLibraryProvider}
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
