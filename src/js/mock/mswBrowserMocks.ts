// src/mocks/browser.js
import { setupWorker } from 'msw';
import { getColdStorageHandlers } from './managementClientColdStorageMSWHandlers';

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(
  ...getColdStorageHandlers(
    'http://management.zenko.local',
    'a5536227-39e1-4e7c-be68-29a19b404131',
  ),
);
