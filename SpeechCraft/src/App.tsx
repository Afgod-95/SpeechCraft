import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState } from './redux/store';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

// Loading component for persistence rehydration
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const AppWrapper = () => {
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.user
  );

  // Router context with proper auth data
  const routerContext = {
    auth: {
      user,
      isAuthenticated,
    },
  };

  return <RouterProvider router={router} context={routerContext} />;
};

export default function AppRoot() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <AppWrapper />
      </PersistGate>
    </Provider>
  );
}