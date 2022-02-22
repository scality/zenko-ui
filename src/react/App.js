import '../css/index.css';

import { history, store } from './store';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import ZenkoUI from './ZenkoUI';

// const whyDidYouRender = require('@welldone-software/why-did-you-render');
// whyDidYouRender(React, {
//     trackAllPureComponents: true,
//     trackExtraHooks: [
//         [require('react-redux/lib'), 'useSelector'],
//     ],
// });

export const queryClient = new QueryClient();

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <QueryClientProvider client={queryClient}>
        <ZenkoUI />
      </QueryClientProvider>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('app'),
);
