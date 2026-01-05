
import { createBridgeComponent } from '@module-federation/bridge-react/v18';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from 'zustand';


const DebugConfigurationStore = ({ store }: { store: any }) => {
  // console.log('DEBUG configurationStore', configurationStore.getState());
  // useStore(propsStore, (state) => {
  //   console.log('DEBUG state propsStore', state);
  // });
  const myState = useStore(store, (state) => {
    console.log('DEBUG state zenko store', state);
    return state;
  });
  return <div>ConfigurationStore:
    {/* <button type="button" onClick={() => {
      propsStore.getState().incrementCounter();
    }}>Click me {propsStore.getState().counter}</button> */}
    <button type="button" onClick={() => {
      myState.decrementCounter();
    }}>Click me zenko decrement {myState.counter}</button>
  </div>;
};
const Home = (props: any) => {
  const { shellNavigate } = props;
  return (
    <div>
      Home
      <button onClick={() => {
        shellNavigate('/platform/alerts');
      }} type="button">Platform Alerts</button>
      {props.store && <DebugConfigurationStore store={props.store} />}
      <Link to="/platform/alerts">Platform Alerts</Link>
    </div >
  );
};




const ConfigProvider = (props: any) => {
  const { config } = props;
  return props.children
};


const ExportApp = (props: any) => {
  const { basename, shellNavigate, config, store } = props;

  return (
    <BrowserRouter basename={basename}>
      <ConfigProvider config={config}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home shellNavigate={shellNavigate} store={store} />} />
        </Routes>
      </ConfigProvider>
    </BrowserRouter>
  );
};

const provider = createBridgeComponent({
  rootComponent: ExportApp,
});

export default provider;
