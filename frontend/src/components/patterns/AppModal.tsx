import React from 'react';
import { Modal, type ModalProps } from '@arco-design/web-react';

type AppModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'detail';

interface AppModalProps extends ModalProps {
  children?: React.ReactNode;
  size?: AppModalSize;
}

const sizeWidthMap: Record<AppModalSize, number> = {
  sm: 560,
  md: 640,
  lg: 760,
  xl: 920,
  detail: 880,
};

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
      className={className ? `app-dialog ${className}` : 'app-dialog'}
      style={{ ...style, width }}
      maskClosable={maskClosable}
      unmountOnExit={unmountOnExit}
      {...rest}
    />
  );
};

export default AppModal;
