import {
  AddButton,
  Buttons,
  Header,
  HeaderKeyTag,
  HeaderValueTag,
  InputTag,
  Inputs,
  Item,
  Items,
  SubButton,
} from '../../../ui-elements/EditableKeyValue';
import React from 'react';
import { Button } from '@scality/core-ui/dist/next';
import type { ObjectMetadata, Tag } from '../../../../types/s3';
import { putObjectTagging } from '../../../actions';
import FormContainer, * as F from '../../../ui-elements/FormLayout';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useDispatch } from 'react-redux';
import { useFieldArray, useForm } from 'react-hook-form';
const EMPTY_ITEM = {
  key: '',
  value: '',
};

const convertToAWSTags = (tags) =>
  tags
    .filter((tag) => tag.key !== '')
    .map((tag) => ({
      Key: tag.key,
      Value: tag.value,
    }));

type Props = {
  objectMetadata: ObjectMetadata;
};

type FormValues = {
  tags: (Tag)[];
};

function Properties({ objectMetadata }: Props) {
  const dispatch = useDispatch();
  const { bucketName, objectKey, tags, versionId } = objectMetadata;
  const defaultValues = {
    tags  : tags.length > 0 ? tags : [EMPTY_ITEM],
  };

  const {
    register,
    reset,
    handleSubmit,
    control,
    getValues,
    formState: { isDirty }
  } = useForm<FormValues>({
    defaultValues
  });

  const onSubmit = (data) => {
    const tags = convertToAWSTags(data.tags);
    console.log('tags: ', tags);
    dispatch(putObjectTagging(bucketName, objectKey, tags, versionId));
    reset(data);
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tags"
  });

  const deleteEntry = () => {
    remove(0);
    append(EMPTY_ITEM);
  };

  return (
    <FormContainer>
      <Header>
        <HeaderKeyTag> Key </HeaderKeyTag>
        <HeaderValueTag> Value </HeaderValueTag>
      </Header>
      <F.CustomForm onSubmit={handleSubmit(onSubmit)}>
      <Items>
          {fields.map((p, i) => {
            return (
              <Item key={i}>
                <Inputs>
                  <InputTag
                    className="tags-input-key"
                    {...register(`tags.${i}.key`)}
                    autoComplete="off"
                  />
                  <InputTag
                    className="tags-input-value"
                    {...register(`tags.${i}.value`)}
                    autoComplete="off"
                  />
                </Inputs>
                <Buttons>
                  <SubButton
                    index={i}
                    items={getValues().tags}
                    deleteEntry={() =>
                      getValues().tags.length === 1
                      ? deleteEntry()
                      : remove(i)
                  }
                  />
                  <AddButton
                    index={i}
                    items={getValues().tags}
                    insertEntry={() => append({key: ' ', value: ' '})}
                  />
                </Buttons>
              </Item>
            );
          })}
        </Items>
      <F.Footer style={{margin: `${spacing.sp32}`}}>
        <F.FooterButtons>
        <Button
          id="tags-button-save"
          variant="secondary"
          label="Save"
          disabled={!isDirty}
          icon={<i className="fas fa-save" />}
          type="submit"
        />
        </F.FooterButtons>
      </F.Footer>
      </F.CustomForm>
    </FormContainer>
  );
}

export default Properties;