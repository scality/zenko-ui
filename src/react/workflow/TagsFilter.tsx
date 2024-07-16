import { AddButton, SubButton } from '../ui-elements/EditableKeyValue';
import { Tag } from '../../types/s3';
import {
  FieldValues,
  Control,
  useFieldArray,
  UseFormWatch,
} from 'react-hook-form';
import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
import { Stack } from '@scality/core-ui';
import { convertSizeToRem } from '@scality/core-ui/dist/components/inputv2/inputv2';

const EMPTY_ITEM = {
  key: '',
  value: '',
};

type Props = {
  tags: Tag[];
  handleChange: (data: Tag[]) => void;
  control: Control<FieldValues, { key: string; value: string }[]>;
  fieldName: string;
  watch: UseFormWatch<FieldValues>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
};

function TagsFilter({
  tags,
  handleChange,
  control,
  fieldName,
  watch,
  onBlur,
}: Props) {
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
    <Stack direction="vertical">
      <Stack gap="r8">
        <div style={{ width: convertSizeToRem('1/2') }}>Key</div>
        <div style={{ width: convertSizeToRem('1/2') }}>Value</div>
      </Stack>
      <Stack gap="r8" direction="vertical">
        {fields.map((_, index) => (
          <Stack gap="r8">
            {/* @ts-expect-error fix this when you are working on it */}
            <Input
              size="1/2"
              autoComplete="off"
              className="tags-input-key"
              aria-label={`Tag ${index + 1} key`}
              data-testid={`tag-${index + 1}-key`}
              value={tags[index]?.key}
              onBlur={onBlur}
              onChange={({ target }) => {
                const updatedTags = [...tags];
                updatedTags[index].key = target.value;
                handleChange(updatedTags);
              }}
            />
            {/* @ts-expect-error fix this when you are working on it */}
            <Input
              size="1/2"
              autoComplete="off"
              className="tags-input-value"
              aria-label={`Tag ${index + 1} value`}
              data-testid={`tag-${index + 1}-value`}
              value={tags[index]?.value}
              onBlur={onBlur}
              onChange={({ target }) => {
                const updatedTags = [...tags];
                updatedTags[index].value = target.value;
                handleChange(updatedTags);
              }}
            />
            <SubButton
              index={index}
              items={tagsFormValues}
              iconStyle={{ margin: 0 }}
              deleteEntry={() =>
                tagsFormValues.length === 1 ? deleteEntry() : remove(index)
              }
            />
            <AddButton
              index={index}
              items={tagsFormValues}
              iconStyle={{ margin: 0 }}
              insertEntry={() => append({ key: '', value: '' })}
            />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

export default TagsFilter;
