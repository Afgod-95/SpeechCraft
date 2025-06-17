import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
//import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import Hero from './components/Hero';
import AuthForm from './components/AuthForm';
import TranscriptionChat from './components/TranscriptionChat';
import { RootState } from './redux/store';
import Navbar from './components/Navbar';
import AuthCallback from './components/AuthCallback';

export type RouterContext = {
  auth: {
    isAuthenticated: boolean;
    user: RootState['user']['user'];
  };
};

// ✅ Root layout without Navbar
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  ),
});

// ✅ Auth layout (no Navbar)
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: () => <Outlet />,
});

// ✅ App layout (no Navbar)
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: () => <TranscriptionChat />,
});

// ✅ Home route with Navbar
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <>
      <Navbar />
      <Hero />
    </>
  ),
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/app/transcribe' });
    }
  },
});

// ✅ Login route
const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  component: () => <AuthForm type="login" />,
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/app/transcribe' });
    }
  },
});

// ✅ Signup route
const signupRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/signup',
  component: () => <AuthForm type="signup" />,
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/app/transcribe' });
    }
  },
});

// ✅ Email confirmation callback route
const callbackRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/callback',
  component: AuthCallback,
});

// ✅ Transcription route
const transcribeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transcribe',
  component: TranscriptionChat,
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
});

// ✅ Build the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  authLayoutRoute.addChildren([loginRoute, signupRoute, callbackRoute]),
  appLayoutRoute.addChildren([transcribeRoute]),
]);

// ✅ Create the router
export const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: false,
      user: null,
    },
  },
});

// ✅ Type registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
    context: RouterContext;
  }
}
