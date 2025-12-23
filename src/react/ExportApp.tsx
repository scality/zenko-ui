
import { createBridgeComponent } from '@module-federation/bridge-react/v18';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      Home
    </div>
  );
};

const ExportApp = (props: any) => {
  const { basename } = props;
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
};

const provider = createBridgeComponent({
  rootComponent: ExportApp,
});

export default provider;
