import React from 'react';
import { Spin } from '@arco-design/web-react';
import { PageForbidden } from '../../components';
import { useAuthStore } from '../../store/useAuthStore';

interface RoutePermissionGuardProps {
  permission?: string;
  children: React.ReactElement;
}

const RoutePermissionGuard: React.FC<RoutePermissionGuardProps> = ({ permission, children }) => {
  const { userInfo } = useAuthStore();

  if (!permission) {
    return children;
  }

  if (!userInfo) {
    return <Spin loading style={{ width: '100%', minHeight: 240 }} />;
  }

  const isAdmin = userInfo.roles?.includes('admin') || false;
  const allowed = isAdmin || userInfo.perms?.includes(permission);

  return allowed ? children : <PageForbidden />;
};

export default RoutePermissionGuard;
