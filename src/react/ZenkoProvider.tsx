import type { AwsCredentialIdentity } from '@aws-sdk/types';
import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import ZenkoClientBase from 'zenkoclient';
import { useConfig } from './next-architecture/ui/ConfigProvider';
import { genClientEndpoint } from './utils';

class ZenkoSiteClient {
  private _jsonClient: ZenkoClientBase;
  private _isLogin = false;

  constructor(endpoint: string, credentials?: AwsCredentialIdentity) {
    this._jsonClient = new ZenkoClientBase({
      accessKeyId: credentials?.accessKeyId || '',
      secretAccessKey: credentials?.secretAccessKey || '',
      sessionToken: credentials?.sessionToken || '',
      //@ts-expect-error fix this when you are working on it
      apiVersion: '2018-07-08-json',
      endpoint: endpoint,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      maxRetries: 0,
    });
    this._isLogin = !!(credentials?.accessKeyId && credentials?.secretAccessKey);
  }

  login(credentials: AwsCredentialIdentity): void {
    this._jsonClient.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    });
    this._isLogin = true;
  }

  logout(): void {
    this._jsonClient.config.update({
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    });
    this._isLogin = false;
  }

  getIsLogin(): boolean {
    return this._isLogin;
  }

  pauseCrrSite(site: string): Promise<Record<string, unknown>> {
    const params = { Site: site };
    //@ts-expect-error fix this when you are working on it
    return this._jsonClient.pauseSite(params).promise();
  }

  resumeCrrSite(site: string): Promise<Record<string, unknown>> {
    const params = { Site: site };
    //@ts-expect-error fix this when you are working on it
    return this._jsonClient.resumeSite(params).promise();
  }

  pauseIngestionSite(site: string): Promise<Record<string, unknown>> {
    const params = { Site: site };
    //@ts-expect-error fix this when you are working on it
    return this._jsonClient.pauseIngestionSite(params).promise();
  }

  resumeIngestionSite(site: string): Promise<Record<string, unknown>> {
    const params = { Site: site };
    //@ts-expect-error fix this when you are working on it
    return this._jsonClient.resumeIngestionSite(params).promise();
  }
}

const ZenkoContext = createContext<ZenkoSiteClient | null>(null);

export const useZenkoClient = () => {
  const zenkoClient = useContext(ZenkoContext);
  if (!zenkoClient) {
    throw new Error('Cannot use useZenkoClient outside of ZenkoProvider');
  }
  return zenkoClient;
};

type ZenkoProviderProps = PropsWithChildren<{
  credentials?: AwsCredentialIdentity;
}>;

export const ZenkoProvider = ({ children, credentials }: ZenkoProviderProps) => {
  const { zenkoEndpoint } = useConfig();

  const zenkoClient = useMemo(() => {
    const endpoint = genClientEndpoint(zenkoEndpoint);
    return new ZenkoSiteClient(endpoint, credentials);
  }, [zenkoEndpoint, credentials?.accessKeyId, credentials?.secretAccessKey, credentials?.sessionToken, credentials]);

  return <ZenkoContext.Provider value={zenkoClient}>{children}</ZenkoContext.Provider>;
};

export type { ZenkoSiteClient };
