import { Fieldset, Input, Label } from '../../../ui-elements/FormLayout';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import React, { useState } from 'react';
import { LocationDetailsFormProps } from '.';
import styled from 'styled-components';
import { AddButton, SubButton } from '../../../ui-elements/EditableKeyValue';
import ColdStorageIcon from '../../../ui-elements/ColdStorageIcon';
type State = {
  endpoint: string;
  repoId: string[];
  nsId: string;
  username: string;
  password: string;
};
const INIT_STATE: State = {
  endpoint: '',
  repoId: [''],
  nsId: '',
  username: '',
  password: '',
};

const RepoIdInputContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

function RepoIdsInput({
  repoIds,
  onChange,
}: {
  repoIds: string[];
  onChange: (repoIds: string[]) => void;
}) {
  const insertEntry = () => {
    onChange([...repoIds, '']);
  };

  const deleteEntry = (entryIndex: number) => {
    let tempRepoIds = [...repoIds];
    tempRepoIds.splice(entryIndex, 1);
    if (tempRepoIds.length === 0) {
      tempRepoIds = [''];
    }
    onChange([...tempRepoIds]);
  };

  return (
    <>
      {
        <Fieldset>
          <Label required htmlFor={`repoIds[${repoIds.length - 1}]`}>
            RepoId(s)
          </Label>
          {repoIds.map((repoId, index) => (
            <RepoIdInputContainer key={index}>
              <Input
                name={`repoIds[${index}]`}
                id={`repoIds[${index}]`}
                type="text"
                placeholder=""
                value={repoId}
                onChange={(evt) => {
                  const tempRepoIds = [...repoIds];
                  tempRepoIds[index] = evt.target.value;
                  onChange(tempRepoIds);
                }}
                autoComplete="off"
              />
              <SubButton
                index={index}
                key={`delete-${repoId}`}
                deleteEntry={deleteEntry}
                items={repoIds}
                disabled={repoId === ''}
              />
              <AddButton
                index={index}
                key={`add-${repoId}`}
                insertEntry={insertEntry}
                items={repoIds}
                disabled={repoId === ''}
              />
            </RepoIdInputContainer>
          ))}
        </Fieldset>
      }
    </>
  );
}

export default function LocationDetailsTapeDMF({
  details,
  onChange,
}: LocationDetailsFormProps) {
  const [formState, setFormState] = useState<State>(() => ({
    ...Object.assign({}, INIT_STATE, details),
  }));

  const onInternalStateChange = (key: string, value: any) => {
    setFormState({ ...formState, [key]: value });

    if (onChange) {
      onChange({ ...formState, [key]: value });
    }
  };

  const onFormItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    onInternalStateChange(target.name, value);
  };

  return (
    <div>
      <Fieldset>
        <Label>Temperature</Label>
        <SpacedBox mt={2}>
          <span>
            <ColdStorageIcon /> Cold
          </span>
        </SpacedBox>
      </Fieldset>
      <Fieldset>
        <Label required htmlFor="endpoint">
          Endpoint
        </Label>
        <Input
          name="endpoint"
          id="endpoint"
          type="text"
          placeholder="example: ws://path.to.my.dmf"
          value={formState.endpoint}
          onChange={onFormItemChange}
          autoComplete="off"
        />
      </Fieldset>
      <RepoIdsInput
        repoIds={formState.repoId}
        onChange={(repoId) => onInternalStateChange('repoId', repoId)}
      />
      <Fieldset>
        <Label required htmlFor="nsId">
          Namespace Id
        </Label>
        <Input
          name="nsId"
          id="nsId"
          type="text"
          placeholder=""
          value={formState.nsId}
          onChange={onFormItemChange}
          autoComplete="off"
        />
      </Fieldset>
      <Fieldset>
        <Label required htmlFor="username">
          Username
        </Label>
        <Input
          name="username"
          id="username"
          type="text"
          placeholder=""
          value={formState.username}
          onChange={onFormItemChange}
          autoComplete="off"
        />
      </Fieldset>
      <Fieldset>
        <Label required htmlFor="password">
          Password
        </Label>
        <Input
          name="password"
          id="password"
          type="password"
          placeholder=""
          value={formState.password}
          onChange={onFormItemChange}
          autoComplete="off"
        />
      </Fieldset>
    </div>
  );
}
