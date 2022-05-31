import {
  AMZ_META,
  METADATA_SYSTEM_TYPE,
  METADATA_USER_TYPE,
  isEmptyItem,
  systemMetadata,
} from '../../../utils';
import {
  AddButton,
  Buttons,
  Char,
  Header,
  HeaderKey,
  HeaderValue,
  InputExtraKey,
  InputValue,
  Inputs,
  Item,
  Items,
  SubButton,
} from '../../../ui-elements/EditableKeyValue';
import {SpacedBox} from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { Button, Select } from '@scality/core-ui/dist/next';
import type {
  ListObjectsType,
  MetadataItem,
  MetadataItems,
  ObjectMetadata,
} from '../../../../types/s3';
import React, { useMemo } from 'react';
import { LIST_OBJECT_VERSIONS_S3_TYPE } from '../../../utils/s3';
import { putObjectMetadata } from '../../../actions';
import FormContainer, * as F from '../../../ui-elements/FormLayout';
import { useDispatch } from 'react-redux';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
const userMetadataOption = {
  value: AMZ_META,
  label: AMZ_META,
};
const selectOptions = systemMetadata
  .map((o) => ({
    value: o.key,
    label: o.header,
  }))
  .concat([userMetadataOption]);

const isUserType = (type) => type === METADATA_USER_TYPE;

const isSystemType = (type) => type === METADATA_SYSTEM_TYPE;

const convertToAWSMetadata = (items: MetadataItems) => {
  const userMetadata = {};
  const systemMetadata = {};

  for (const item of items) {
    const { type, key, value } = item;

    if (isEmptyItem(item)) {
      continue;
    }

    if (isUserType(type)) {
      userMetadata[key] = value;
    } else if (isSystemType(type)) {
      systemMetadata[key] = value;
    }
  }

  return {
    systemMetadata,
    userMetadata,
  };
};

type Props = {
  objectMetadata: ObjectMetadata;
  listType: ListObjectsType;
};

type FormValues = {
  metadata: (MetadataItem & { mdKey: string })[];
};

function Metadata({ objectMetadata, listType }: Props) {
  const dispatch = useDispatch();
  const { bucketName, objectKey, metadata } = objectMetadata;
  const isVersioningType = listType === LIST_OBJECT_VERSIONS_S3_TYPE;
  const EMPTY_ITEM = {
    key: '',
    value: '',
    mdKey: '',
    type: METADATA_SYSTEM_TYPE,
  };
  const defaultValues = {
    metadata: metadata.map((item) => ({
      ...item,
      key: isUserType(item.type) ? AMZ_META : item.key,
      mdKey: isUserType(item.type) ? item.key.replace(AMZ_META + '-', '') : '',
    })),
  };
  const {
    register,
    reset,
    handleSubmit,
    control,
    getValues,
    formState: { isDirty },
  } = useForm<FormValues>({
    defaultValues,
  });

  const onSubmit = (data) => {
    const { systemMetadata, userMetadata } = convertToAWSMetadata(
      data.metadata.map((item) => ({
        key: isUserType(item.type) ? item.mdKey : item.key,
        type: item.type,
        value: item.value,
      })),
    );

    dispatch(
      putObjectMetadata(bucketName, objectKey, systemMetadata, userMetadata),
    );

    reset(data);
  };

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'metadata',
  });

  const deleteEntry = () => {
    remove(0);
    append(EMPTY_ITEM);
  };

  return (
    <FormContainer>
      <SpacedBox m={32}>
        <Header>
          <HeaderKey> Key </HeaderKey>
          <HeaderValue> Value </HeaderValue>
        </Header>
      </SpacedBox>
      <F.CustomForm onSubmit={handleSubmit(onSubmit)}>
        <Items>
          {fields.map((field, index) => {
            const isUserMD = isUserType(field.type);
            return (
              <Item isShrink={isUserMD} key={field.key + index}>
                <Inputs>
                  <Controller
                    control={control}
                    name={`metadata.${index}.key`}
                    render={({ field: { onChange: setKey, value: key } }) => {
                      const remainingOptions = selectOptions.filter(
                        (option) =>
                          !fields.find(
                            (item) =>
                              isSystemType(item.type) &&
                              option.value === item.key &&
                              key !== item.key,
                          ),
                      );
                      const onChange = (newKey) => {
                        setKey(newKey);
                        if (newKey === AMZ_META) {
                          update(index, {
                            type: METADATA_USER_TYPE,
                            key: newKey,
                            value: '',
                            mdKey: '',
                          });
                        } else {
                          update(index, {
                            type: METADATA_SYSTEM_TYPE,
                            key: newKey,
                            value: '',
                          });
                        }
                      };

                      return (
                        <F.Select
                          onChange={onChange}
                          value={key}
                          disabled={isVersioningType}
                          id={`select-${index}`}
                        >
                          {remainingOptions.map((opt, i) => (
                            <Select.Option key={i} value={opt.value}>
                              {opt.label}
                            </Select.Option>
                          ))}
                        </F.Select>
                      );
                    }}
                  />
                  {isUserMD && <Char>-</Char>}
                  {isUserMD && (
                    <InputExtraKey
                      className="metadata-input-extra-key"
                      {...register(`metadata.${index}.mdKey`)}
                      aria-label={`Custom metadata key`}
                      disabled={isVersioningType}
                    />
                  )}
                  <Char>:</Char>
                  <InputValue
                    id="mdValue"
                    {...register(`metadata.${index}.value`)}
                    aria-label={`${field.key}${field.mdKey ? `-${field.mdKey}` : ''} value`}
                    className="metadata-input-value"
                    isShrink={isUserMD}
                    disabled={isVersioningType}
                    autoComplete="off"
                  />
                </Inputs>
                <Buttons>
                  <SubButton
                    disabled={isVersioningType}
                    index={index}
                    items={getValues().metadata}
                    deleteEntry={() =>
                      getValues().metadata.length === 1
                        ? deleteEntry()
                        : remove(index)
                    }
                  />
                  <AddButton
                    disabled={isVersioningType}
                    index={index}
                    items={getValues().metadata}
                    insertEntry={() =>
                      append({
                        key: `${AMZ_META}`,
                        value: '',
                        type: METADATA_USER_TYPE,
                      })
                    }
                  />
                </Buttons>
              </Item>
            );
          })}
        </Items>
        <SpacedBox m={32}>
          <F.Footer>
            <F.FooterButtons>
              <Button
                id="metadata-button-save"
                variant="secondary"
                style={{ margin: `${spacing.sp16}` }}
                label="Save"
                disabled={isVersioningType || !isDirty}
                icon={<i className="fas fa-save" />}
                type="submit"
              />
            </F.FooterButtons>
          </F.Footer>
        </SpacedBox>
      </F.CustomForm>
    </FormContainer>
  );
}

export default Metadata;
