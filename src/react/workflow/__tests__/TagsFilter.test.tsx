import { render, screen, fireEvent } from '@testing-library/react';
import { Controller, useForm } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import TagsFilter from '../TagsFilter';
import { QueryClient, QueryClientProvider } from 'react-query';

describe('TagsFilter', () => {
  it('should render TagsFilters', async () => {
    const ExpirationForm = () => {
      const { control, watch } = useForm({
        defaultValues: {
          'filter.objectTags': [{ key: '', value: '' }],
        },
      });

      return (
        <Controller
          name="filter.objectTags"
          control={control}
          render={({ field: { onChange, value } }) => {
            return (
              <TagsFilter
                handleChange={onChange}
                //@ts-expect-error fix this when you are working on it
                control={control}
                fieldName="filter.objectTags"
                tags={value}
                //@ts-expect-error fix this when you are working on it
                watch={watch}
              />
            );
          }}
        />
      );
    };

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ExpirationForm />
      </QueryClientProvider>,
    );

    const firstKeyField = screen.getByTestId('tag-1-key');
    expect(firstKeyField).toBeInTheDocument();
    const firstValueField = screen.getByTestId('tag-1-value');
    expect(firstValueField).toBeInTheDocument();

    const sampleKeyName = 'secretdoor';
    await userEvent.type(firstKeyField, sampleKeyName);
    expect(firstKeyField).toHaveValue(sampleKeyName);

    const sampleValue = 'secretwindow';
    await userEvent.type(firstValueField, sampleValue);
    expect(firstValueField).toHaveValue(sampleValue);

    const addButon = screen.getByRole('button', { name: 'Add' });
    expect(addButon).toBeInTheDocument();
    fireEvent.click(addButon);

    const secondKeyField = screen.getByRole('textbox', { name: 'Tag 2 key' });
    expect(secondKeyField).toBeInTheDocument();
    const secondValueField = screen.getByRole('textbox', {
      name: 'Tag 2 value',
    });
    expect(secondValueField).toBeInTheDocument();

    const delButton2 = screen.getAllByRole('button', { name: 'Remove' })[1];
    expect(delButton2).toBeInTheDocument();
    fireEvent.click(delButton2);
    expect(secondKeyField).not.toBeInTheDocument();
    expect(secondValueField).not.toBeInTheDocument();
  });
});
