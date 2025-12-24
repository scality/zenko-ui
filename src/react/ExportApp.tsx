
import { createBridgeComponent } from '@module-federation/bridge-react/v18';
import { ShellHooksProvider, useShellHooks } from '@scality/module-federation';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

const Home = (props: any) => {
  // const { useLinkOpener } = useShellHooks();
  // const { openLink } = useLinkOpener();
  const { shellNavigate } = props;
  return (
    <div>
      Home
      {/* <button onClick={() => {
        openLink({
          view: {
            path: '/platform/alerts',
            label: {
              en: 'Platform Alerts',
              fr: 'Alerts de la plateforme',
            },
            module: './FederableApp',
            scope: 'zenko',
          },
          app: {
            kind: 'metalk8s-ui',
            name: 'metalk8s-ui.eu-west-1',
            version: 'local-dev',
            url: 'http://127.0.0.1:8383/metalk8s',
          },
          isFederated: true,
        });
      }} type="button">Platform Alerts</button> */}
      <button onClick={() => {
        shellNavigate('/platform/alerts');
      }} type="button">Platform Alerts</button>
      <Link to="/platform/alerts">Platform Alerts</Link>
    </div >
  );
};

const ExportApp = (props: any) => {
  const { basename, shellNavigate } = props;
  return (
    <BrowserRouter basename={basename}>
      <ShellHooksProvider
        shellHooks={props.shellHooks}
        shellAlerts={props.shellAlerts}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home shellNavigate={shellNavigate} />} />
        </Routes>
      </ShellHooksProvider>
    </BrowserRouter>
  );
};

const provider = createBridgeComponent({
  rootComponent: ExportApp,
});

export default provider;
