import { HTMLProps } from 'react';
import { Box } from '@scality/core-ui/dist/next';
import { AddButton, SubButton } from './EditableKeyValue';
import { Input, Label } from './FormLayout';

function InputList({
  label,
  id,
  values,
  required,
  onChange,
  getInputProps,
  maxItems,
}: {
  id: string;
  maxItems?: number;
  required?: boolean;
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  getInputProps?: (
    value: string,
    index: number,
  ) => Omit<
    HTMLProps<HTMLInputElement>,
    'onChange' | 'name' | 'value' | 'id' | 'ref' | 'as'
  >;
}) {
  const isMaxItemsReached =
    maxItems !== undefined && maxItems !== null && values.length === maxItems;
  const insertEntry = () => {
    if (!isMaxItemsReached) {
      onChange([...values, '']);
    }
  };

  const deleteEntry = (entryIndex: number) => {
    let tempValues = [...values];
    tempValues.splice(entryIndex, 1);
    if (tempValues.length === 0) {
      tempValues = [''];
    }
    onChange([...tempValues]);
  };

  return (
    <>
      {label && (
        <Label
          required={required}
          htmlFor={`${id}[${values.length - 1}]`}
          tooltipMessages={maxItems ? [`max. ${maxItems} entries`] : undefined}
          tooltipWidth={'10rem'}
        >
          {label}
        </Label>
      )}
      {values.map((value, index) => (
        <Box display="flex" gap="1rem" alignItems="center" key={index}>
          <Input
            {...(getInputProps ? getInputProps(value, index) : {})}
            name={`${id}[${index}]`}
            id={`${id}[${index}]`}
            value={value}
            onChange={(evt) => {
              const tempValues = [...values];
              tempValues[index] = evt.target.value;
              onChange(tempValues);
            }}
          />
          {/* disable the sub button only for the first value which is not empty*/}
          <SubButton
            index={index}
            key={`${id}-delete-${values.join(',') + index}`}
            deleteEntry={deleteEntry}
            items={values}
            disabled={values.length === 1 && values[0] === ''}
          />
          <AddButton
            index={index}
            key={`${id}-add-${values.join(',') + index}`}
            insertEntry={insertEntry}
            items={values}
            disabled={value === '' || isMaxItemsReached}
          />
        </Box>
      ))}
    </>
  );
}

export default InputList;
