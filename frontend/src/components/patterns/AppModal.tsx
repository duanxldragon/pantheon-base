import React from 'react';
import { Modal, type ModalProps } from '@arco-design/web-react';

type AppModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'detail';

interface AppModalProps extends ModalProps {
  children?: React.ReactNode;
  size?: AppModalSize;
}

type AppModalStaticConfig = Parameters<typeof Modal.confirm>[0] & {
  size?: AppModalSize;
};

const sizeWidthMap: Record<AppModalSize, number> = {
  sm: 560,
  md: 640,
  lg: 760,
  xl: 920,
  detail: 880,
};

function mergeDialogClassName(base: string, className?: string | string[]) {
  if (Array.isArray(className)) {
    return [base, ...className];
  }
  return className ? `${base} ${className}` : base;
}

function resolveDialogStyle(config: AppModalStaticConfig) {
  return {
    ...config.style,
    width: config.style?.width ?? sizeWidthMap[config.size ?? 'lg'],
  };
}

export function showAppModalConfirm(config: AppModalStaticConfig) {
  return Modal.confirm({
    ...config,
    className: mergeDialogClassName('app-dialog', config.className),
    style: resolveDialogStyle(config),
  });
}

export function showAppModalSuccess(config: AppModalStaticConfig) {
  return Modal.success({
    ...config,
    className: mergeDialogClassName('app-dialog', config.className),
    style: resolveDialogStyle(config),
  });
}

export function showAppModalError(config: AppModalStaticConfig) {
  return Modal.error({
    ...config,
    className: mergeDialogClassName('app-dialog', config.className),
    style: resolveDialogStyle(config),
  });
}

const AppModal: React.FC<AppModalProps> = ({
  className,
  size = 'lg',
  style,
  maskClosable = false,
  unmountOnExit = true,
  ...rest
}) => {
  const width = style?.width ?? sizeWidthMap[size];

  return (
    <Modal
      className={mergeDialogClassName('app-dialog', className)}
      style={{ ...style, width }}
      maskClosable={maskClosable}
      unmountOnExit={unmountOnExit}
      {...rest}
    />
  );
};

export default AppModal;
