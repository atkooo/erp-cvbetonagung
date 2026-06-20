/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { appRouter } from './AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { fetchCompanyProfileFromServer } from './utils/companyProfile';

export default function App() {
  useEffect(() => void fetchCompanyProfileFromServer(), []);

  return (
    <AuthProvider>
      <RouterProvider router={appRouter} />
    </AuthProvider>
  );
}
