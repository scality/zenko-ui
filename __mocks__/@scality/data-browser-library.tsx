import React from 'react';

/**
 * Mock for @scality/data-browser-library
 *
 * This mock is necessary because:
 * 1. The library uses ESM modules which Jest 27 has limited support for
 * 2. The library uses @tanstack/react-query v5 while this project uses react-query v3
 * 3. Following unit testing best practices: mock external dependencies to isolate tests
 *
 * We only mock the DataBrowserProvider to avoid initialization issues in tests.
 * Other components can be added as needed.
 */

export const DataBrowserProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <>{children}</>;
};
