import React, { useEffect } from 'react';
import { Form, Input, Select } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import {
  type MdqaorderCreatePayload,
  type MdqaorderUpdatePayload,
} from './api';
import { SubmitBar } from '../../../components';



const FormItem = Form.Item;

export interface MdqaorderFormValues extends Partial<MdqaorderCreatePayload>, Partial<MdqaorderUpdatePayload> {}

export interface MdqaorderFormProps {
  mode: 'create' | 'update';
  initialValues?: MdqaorderFormValues;
  submitting?: boolean;
  onSubmit: (values: MdqaorderFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

const MdqaorderForm: React.FC<MdqaorderFormProps> = ({
  mode,
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm<MdqaorderFormValues>();

  const { t } = useTranslation();

  useEffect(() => {
    form.setFieldsValue(initialValues || {});
  }, [form, initialValues]);



  return (
    <Form form={form} layout="vertical" onSubmit={onSubmit}>
      <FormItem label={t('business.mdqaorder.field.name.label')} field="name" rules={[{ required: true }]}>
        <Input />
      </FormItem>
      <FormItem label={t('business.mdqaorder.field.status.label')} field="status" rules={[{ required: true }]}>
        <Select allowClear>
                <Select.Option value="draft">{t('business.mdqaorder.field.status.option.draft')}</Select.Option>
                <Select.Option value="active">{t('business.mdqaorder.field.status.option.active')}</Select.Option>
        </Select>
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

export default MdqaorderForm;
