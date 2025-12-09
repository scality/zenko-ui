import { createContext, useContext, useMemo, PropsWithChildren } from 'react';
import ZenkoClientBase from 'zenkoclient';
import { useConfig } from './next-architecture/ui/ConfigProvider';
import { genClientEndpoint } from './utils';
import { Site, ZenkoMapResp } from '../types/zenko';
import { S3Credentials } from '@scality/data-browser-library';
class ZenkoSiteClient {
  private _jsonClient: ZenkoClientBase;
  private _isLogin = false;

  constructor(endpoint: string, credentials?: S3Credentials) {
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
    this._isLogin = !!(
      credentials?.accessKeyId && credentials?.secretAccessKey
    );
  }

  login(credentials: S3Credentials): void {
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

  pauseCrrSite(site: Site): Promise<ZenkoMapResp> {
    const params = { Site: site };
    //@ts-expect-error fix this when you are working on it
    return this._jsonClient.pauseSite(params).promise();
  }

  resumeCrrSite(site: Site): Promise<ZenkoMapResp> {
    const params = { Site: site };
    //@ts-expect-error fix this when you are working on it
    return this._jsonClient.resumeSite(params).promise();
  }

  pauseIngestionSite(site: Site): Promise<ZenkoMapResp> {
    const params = { Site: site };
    //@ts-expect-error fix this when you are working on it
    return this._jsonClient.pauseIngestionSite(params).promise();
  }

  resumeIngestionSite(site: Site): Promise<ZenkoMapResp> {
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
  credentials?: S3Credentials;
}>;

export const ZenkoProvider = ({
  children,
  credentials,
}: ZenkoProviderProps) => {
  const { zenkoEndpoint } = useConfig();

  const zenkoClient = useMemo(() => {
    const endpoint = genClientEndpoint(zenkoEndpoint);
    return new ZenkoSiteClient(endpoint, credentials);
  }, [
    zenkoEndpoint,
    credentials?.accessKeyId,
    credentials?.secretAccessKey,
    credentials?.sessionToken,
  ]);

  return (
    <ZenkoContext.Provider value={zenkoClient}>
      {children}
    </ZenkoContext.Provider>
  );
};

export type { ZenkoSiteClient };
