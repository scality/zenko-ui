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
} from '../ui-elements/EditableKeyValue';
import type { Tags, Tag } from '../../types/s3';
import FormContainer, * as F from '../ui-elements/FormLayout';
import { useFieldArray, useForm } from 'react-hook-form';
import { useEffect } from 'react';
const EMPTY_ITEM = {
  key: '',
  value: '',
};

const removeEmptyKeys = (tags: Tag[]) =>
  tags
    .filter((tag) => tag.key !== '');

type Props = {
  objectMetadata: { tags: Tags };
  handleChange:  (data: Array<{key, value}>) => void;
};

type FormValues = {
  tags: Tag[];
};

function TagsFilter({ objectMetadata, handleChange }: Props) {
  const {
    tags,
  } = objectMetadata;
  const defaultValues = {
    tags: tags.length > 0 ? tags : [EMPTY_ITEM],
  };

  const {
    register,
    control,
    watch,
  } = useForm<FormValues>({
    defaultValues,
  });

  const tagsFormValues = watch("tags");
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tags',
  });

  const deleteEntry = () => {
    remove(0);
    append(EMPTY_ITEM);
  };

  useEffect(() => {
    handleChange(removeEmptyKeys(tagsFormValues));
  }, [JSON.stringify(tagsFormValues)]);

  return (
    <FormContainer style={{ margin: 0, marginBottom: 0 }}>
      <Header>
        <HeaderKeyTag> Key </HeaderKeyTag>
        <HeaderValueTag> Value </HeaderValueTag>
      </Header>
      <F.CustomForm style={{ height: 'initial', margin: 0 }}>
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
                    iconStyle={{ margin: 0 }}
                    deleteEntry={() =>
                      tagsFormValues.length === 1
                        ? deleteEntry()
                        : remove(index)
                    }
                  />
                  <AddButton
                    index={index}
                    items={tagsFormValues}
                    iconStyle={{ margin: 0 }}
                    insertEntry={() => append({ key: '', value: '' })}
                  />
                </Buttons>
              </Item>
            );
          })}
        </Items>
      </F.CustomForm>
    </FormContainer>
  );
}

export default TagsFilter;
