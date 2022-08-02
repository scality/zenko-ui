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
import { Button } from '@scality/core-ui/dist/next';
import type { ObjectMetadata, Tag } from '../../../../types/s3';
import { putObjectTagging } from '../../../actions';
import FormContainer, * as F from '../../../ui-elements/FormLayout';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useDispatch } from 'react-redux';
import { useFieldArray, useForm } from 'react-hook-form';
import { SpacedBox } from '@scality/core-ui';
import { useEffect } from 'react';
const EMPTY_ITEM = {
  key: '',
  value: '',
};

const convertToAWSTags = (tags: Tag[]) =>
  tags
    .filter((tag) => tag.key !== '')
    .map((tag) => ({
      Key: tag.key,
      Value: tag.value,
    }));

type Props = {
  bucketName: string;
  objectKey: string;
  tags: Tag[];
  versionId: string;
};

type FormValues = {
  tags: Tag[];
};

const prepareFormData = (tags: Tag[]) => ({
  tags: tags.length > 0 ? tags : [EMPTY_ITEM],
});

function Properties({ bucketName, objectKey, tags, versionId }: Props) {
  const dispatch = useDispatch();
  const defaultValues = prepareFormData(tags);

  const {
    register,
    reset,
    handleSubmit,
    control,
    watch,
    formState: { isDirty },
  } = useForm<FormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset(prepareFormData(tags));
  }, [tags]);

  const tagsFormValues = watch('tags');

  const onSubmit = (data: FormValues) => {
    const tags = convertToAWSTags(data.tags);
    dispatch(putObjectTagging(bucketName, objectKey, tags, versionId));
    reset(data);
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tags',
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
          {fields.map((_, index) => {
            return (
              <Item key={index}>
                <Inputs>
                  <InputTag
                    className="tags-input-key"
                    aria-label={`Tag ${index + 1} key`}
                    {...register(`tags.${index}.key`)}
                    autoComplete="off"
                  />
                  <InputTag
                    className="tags-input-value"
                    aria-label={`Tag ${index + 1} value`}
                    {...register(`tags.${index}.value`)}
                    autoComplete="off"
                  />
                </Inputs>
                <Buttons>
                  <SubButton
                    index={index}
                    items={tagsFormValues}
                    deleteEntry={() =>
                      tagsFormValues.length === 1
                        ? deleteEntry()
                        : remove(index)
                    }
                  />
                  <AddButton
                    index={index}
                    items={tagsFormValues}
                    insertEntry={() => append({ key: '', value: '' })}
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
                id="tags-button-save"
                variant="secondary"
                label="Save"
                disabled={!isDirty}
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

export default Properties;
