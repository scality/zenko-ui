// src/mocks/browser.js
import { setupWorker } from 'msw';
import { getColdStorageHandlers } from './managementClientColdStorageMSWHandlers';

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(
  ...getColdStorageHandlers(
    'http://management.zenko.local',
    '25050307-cd09-4feb-9c2e-c93e2e844fea',
  ),
);
