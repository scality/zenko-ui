import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import { Controller, useForm } from "react-hook-form";
import userEvent from '@testing-library/user-event';
import TagsFilter from "../TagsFilter";
import { debug } from 'webpack';

describe('TagsFilter', () => {
  it('should render TagsFilters', () => {
    const ExpirationForm = () => {
      const { control, watch } = useForm({
        defaultValues: {
          'filter.objectTags': [{key: '', value: ''}],
        },
      });

      return (
        <Controller
          name="filter.objectTags"
          control={control}
          defaultValue={[{key: '', value: ''}]}
          render={({ field: { onChange, value } }) => {
            return (
              <TagsFilter
                handleChange={onChange}
                control={control}
                fieldName="filter.objectTags"
                tags={value}
                watch={watch}
              />
            );
          }}
        />
      );
    };

    render(<ExpirationForm />);

    const firstKeyField = screen.getByTestId('tag-1-key');
      expect(firstKeyField).toBeInTheDocument();
      const firstValueField = screen.getByTestId('tag-1-value');
      expect(firstValueField).toBeInTheDocument();

      const sampleKeyName = 'secretdoor';
      userEvent.type(firstKeyField, sampleKeyName);
      screen.debug(); 
      expect(firstKeyField).toHaveValue(reverseString(sampleKeyName));

      const sampleValue = 'secretwindow';
      userEvent.type(firstValueField, sampleValue);
      expect(firstValueField).toHaveValue(reverseString(sampleValue));

      const addButon = screen.getByRole('button', { name: 'Add' });
      expect(addButon).toBeInTheDocument();
      fireEvent.click(addButon);

      const secondKeyField = screen.getByRole('textbox', { name: 'Tag 2 key'});
      expect(secondKeyField).toBeInTheDocument();
      const secondValueField = screen.getByRole('textbox', { name: 'Tag 2 value'});
      expect(secondValueField).toBeInTheDocument();

      const delButton2 = screen.getAllByRole('button', { name: 'Remove'})[1];
      expect(delButton2).toBeInTheDocument();
      fireEvent.click(delButton2);
      expect(secondKeyField).not.toBeInTheDocument();
      expect(secondValueField).not.toBeInTheDocument();
  });
});

function reverseString(str: string) {
  return str.split("").reverse().join("");
}