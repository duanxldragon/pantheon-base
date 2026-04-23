import { Suspense, lazy, type ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from '@arco-design/web-react';
import { useAuthStore } from './store/useAuthStore';
import { systemRoutes } from './core/router/modules';
import RoutePermissionGuard from './core/router/RoutePermissionGuard';
import { PageNotFound } from './components';

const BaseLayout = lazy(() => import('./core/layout'));
const LoginPage = lazy(() => import('./modules/auth/Login'));

const AuthGuard = ({ children }: { children: ReactElement }) => {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Suspense fallback={<Spin loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <BaseLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          {systemRoutes.map((route) => {
            const Component = route.component;
            return (
              <Route
                key={route.path}
                path={route.path}
                element={(
                  <RoutePermissionGuard permission={route.pagePermission}>
                    <Component />
                  </RoutePermissionGuard>
                )}
              />
            );
          })}
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
