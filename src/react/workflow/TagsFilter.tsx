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
import type { Tag } from '../../types/s3';
import FormContainer, * as F from '../ui-elements/FormLayout';
import { FieldValues, Control, useFieldArray, UseFormWatch } from 'react-hook-form';
const EMPTY_ITEM = {
  key: '',
  value: '',
};

type Props = {
  tags: Tag[];
  handleChange:  (data: Tag[]) => void;
  control: Control<FieldValues, any>;
  fieldName: string;
  watch: UseFormWatch<FieldValues>
};

function TagsFilter({ tags, handleChange, control, fieldName, watch }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const deleteEntry = () => {
    remove(0);
    append(EMPTY_ITEM);
  };

  const tagsFormValues = watch(fieldName);

  return (
    <FormContainer style={{ margin: 0, marginBottom: 0 }}>
      <Header>
        <HeaderKeyTag> Key </HeaderKeyTag>
        <HeaderValueTag> Value </HeaderValueTag>
      </Header>
      <F.CustomForm style={{ height: 'initial', margin: 0 }} data-testid="tags-form">
        <Items>
          {fields.map((_, index) => {
            return (
              <Item key={index}>
                <Inputs>
                  <InputTag
                    className="tags-input-key"
                    aria-label={`Tag ${index + 1} key`}
                    data-testid={`tag-${index+1}-key`}
                    value={tags[index]?.key}
                    onChange={({ target }) => {
                      const updatedTags = tags.slice(0);
                      updatedTags[index].key = target.value;
                      handleChange(updatedTags);
                    }}
                    autoComplete="off"
                  />
                  <InputTag
                    className="tags-input-value"
                    aria-label={`Tag ${index + 1} value`}
                    data-testid={`tag-${index+1}-value`}
                    onChange={({ target }) => {
                      const updatedTags = [...tags];
                      updatedTags[index].value = target.value;
                      handleChange(updatedTags);
                    }}
                    value={tags[index]?.value}
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
