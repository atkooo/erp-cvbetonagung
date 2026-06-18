/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { appRouter } from './AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { fetchCompanyProfileFromServer } from './utils/companyProfile';

export default function App() {
  // Fetch Company Profile on app mount
  useEffect(() => {
    fetchCompanyProfileFromServer();
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={appRouter} />
    </AuthProvider>
  );
}
