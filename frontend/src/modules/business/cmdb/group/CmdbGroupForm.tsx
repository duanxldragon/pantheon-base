import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Select, Button, Space, Radio } from '@arco-design/web-react';
import { IconPlus, IconDelete } from '@arco-design/web-react/icon';
import type { GroupRow, ConditionRule } from './api';
import SubmitBar from '../../../../components/patterns/SubmitBar';

interface Props {
  editing: GroupRow | null;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function CmdbGroupForm({ editing, onSubmit, onCancel, submitting }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const opOptions = [
    { value: 'eq', label: t('business.cmdb.group.condition.op.eq') },
    { value: 'neq', label: t('business.cmdb.group.condition.op.neq') },
    { value: 'in', label: t('business.cmdb.group.condition.op.in') },
    { value: 'notIn', label: t('business.cmdb.group.condition.op.notIn') },
  ];

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        description: editing.description,
        operator: editing.conditions?.operator || 'AND',
        rules: editing.conditions?.rules?.length
          ? editing.conditions.rules
          : [{ key: '', op: 'eq', val: '' }],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ operator: 'AND', rules: [{ key: '', op: 'eq', val: '' }] });
    }
  }, [editing, form]);

  const handleFinish = async () => {
    const values = await form.validate();
    const rules: ConditionRule[] = (values.rules || []).filter(
      (r: any) => r.key && r.val !== undefined && r.val !== '',
    );
    onSubmit({
      name: values.name,
      description: values.description,
      conditions: {
        operator: values.operator,
        rules,
      },
    });
  };

  return (
    <Form form={form} layout="vertical" onSubmit={handleFinish}>
      <Form.Item
        label={t('business.cmdb.group.name')}
        field="name"
        rules={[{ required: true, message: t('common.required') }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label={t('business.cmdb.group.description')} field="description">
        <Input />
      </Form.Item>
      <Form.Item
        label={t('business.cmdb.group.condition.operator')}
        field="operator"
      >
        <Radio.Group>
          <Radio value="AND">{t('business.cmdb.group.condition.operator.and')}</Radio>
          <Radio value="OR">{t('business.cmdb.group.condition.operator.or')}</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label={t('business.cmdb.group.conditions')}>
        <Form.List field="rules">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Space key={field.key} align="start" style={{ marginBottom: 8 }}>
                  <Form.Item field={`rules[${index}].key`} noStyle
                    rules={[{ required: true }]}>
                    <Input
                      placeholder={t('business.cmdb.group.condition.key')}
                      style={{ width: 130 }}
                    />
                  </Form.Item>
                  <Form.Item field={`rules[${index}].op`} noStyle>
                    <Select style={{ width: 110 }}>
                      {opOptions.map((o) => (
                        <Select.Option key={o.value} value={o.value}>
                          {o.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item field={`rules[${index}].val`} noStyle
                    rules={[{ required: true }]}>
                    <Input
                      placeholder={t('business.cmdb.group.condition.val')}
                      style={{ width: 180 }}
                    />
                  </Form.Item>
                  <Button
                    type="text"
                    status="danger"
                    icon={<IconDelete />}
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  />
                </Space>
              ))}
              <Button type="dashed" icon={<IconPlus />} onClick={() => add({ key: '', op: 'eq', val: '' })}>
                {t('business.cmdb.group.condition.addRule')}
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>
      <SubmitBar
        onCancel={onCancel}
        loading={submitting}
        submitText={editing ? t('common.save') : t('common.create')}
      />
    </Form>
  );
}
