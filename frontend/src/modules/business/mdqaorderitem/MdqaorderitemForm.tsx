import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Switch } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import {
  type MdqaorderitemCreatePayload,
  type MdqaorderitemUpdatePayload,
} from './api';
import { SubmitBar } from '../../../components';



const FormItem = Form.Item;

export interface MdqaorderitemFormValues extends Partial<MdqaorderitemCreatePayload>, Partial<MdqaorderitemUpdatePayload> {}

export interface MdqaorderitemFormProps {
  mode: 'create' | 'update';
  initialValues?: MdqaorderitemFormValues;
  submitting?: boolean;
  onSubmit: (values: MdqaorderitemFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

const MdqaorderitemForm: React.FC<MdqaorderitemFormProps> = ({
  mode,
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm<MdqaorderitemFormValues>();

  const { t } = useTranslation();

  useEffect(() => {
    form.setFieldsValue(initialValues || {});
  }, [form, initialValues]);



  return (
    <Form form={form} layout="vertical" onSubmit={onSubmit}>
      <FormItem label={t('business.mdqaorderitem.field.itemName.label')} field="itemName" rules={[{ required: true }]}>
        <Input />
      </FormItem>
      <FormItem label={t('business.mdqaorderitem.field.quantity.label')} field="quantity" rules={[{ required: true }]}>
        <InputNumber style={{ width: '100%' }} />
      </FormItem>
      <FormItem label={t('business.mdqaorderitem.field.enabled.label')} field="enabled" triggerPropName="checked">
        <Switch />
      </FormItem>
      <FormItem label={t('business.mdqaorderitem.field.remark.label')} field="remark">
        <Input />
      </FormItem>
      <FormItem label={t('business.mdqaorderitem.field.orderId.label')} field="orderId" rules={[{ required: true }]}>
        <InputNumber style={{ width: '100%' }} />
      </FormItem>
      <SubmitBar
        onCancel={onCancel}
        onSubmit={() => {
          form.submit();
        }}
        loading={submitting}
        submitText={mode === 'create' ? t('common.create') : t('common.save')}
      />
    </Form>
  );
};

export default MdqaorderitemForm;
