import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { useCombobox } from 'downshift';
import {
  AWS_PAGINATED_QUERY,
  useAwsPaginatedEntities,
} from '../../utils/IAMhooks';
import { Box, Table } from '@scality/core-ui/dist/next';
import {
  GentleEmphaseSecondaryText,
  InlineButton,
} from '../../ui-elements/Table';
import {
  Icon,
  Loader,
  SearchInput,
  SecondaryText,
  Tooltip,
} from '@scality/core-ui';
import styled from 'styled-components';
import { spacing } from '@scality/core-ui/dist/style/theme';
import {
  AttachableEntity,
  AttachmentOperation,
  AttachmentAction,
} from './AttachmentTypes';

type AttachableEntityWithPendingStatus = {
  isPending?: boolean;
} & AttachableEntity;

export type AttachmentTableProps<
  API_RESPONSE extends {
    Marker?: string;
  },
> = {
  initiallyAttachedEntities: AttachableEntity[];
  getAllEntitiesPaginatedQuery: () => AWS_PAGINATED_QUERY<
    API_RESPONSE,
    AttachableEntity
  >;
  getEntitiesFromResult: (response: API_RESPONSE) => AttachableEntity[];
  initialAttachmentOperations: AttachmentOperation[];
  onAttachmentsOperationsChanged: (
    attachmentOperations: AttachmentOperation[],
  ) => void;
};

const rowHeight = 'h48';

const MenuContainer = styled.ul<{
  width: string;
  isOpen: boolean;
  searchInputIsFocused: boolean;
}>`
  background-color: ${(props) => props.theme.brand.backgroundLevel1};
  background-clip: content-box;
  padding: 0;
  list-style: none;
  position: absolute;
  width: ${(props) => props.width};
  z-index: 1;
  margin-top: -1.7rem;
  margin-left: 0;
  margin-bottom: 0;
  margin-right: 0;
  ${(props) =>
    props.isOpen
      ? `
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      border-bottom-right-radius: 4px;
      border-bottom-left-radius: 4px;
      border: 1px solid ${props.theme.brand.selectedActive};
  `
      : props.searchInputIsFocused
      ? `border-bottom: 1px solid ${props.theme.brand.selectedActive};`
      : ''}
  border-top: 0;
  li {
    padding: ${spacing.sp8};
    cursor: pointer;
    border-top: 1px solid ${(props) => props.theme.brand.backgroundLevel2};
    &[aria-selected='true'] {
      background: ${(props) => props.theme.brand.highlight};
    }
  }
`;

const SearchBoxContainer = styled.div`
  margin-bottom: ${spacing.sp24};
  width: 78%;
  .sc-tooltip {
    width: 100%;
  }
`;

const StyledSearchInput = styled(SearchInput)`
  flex-grow: 1;
  .sc-input-type:focus {
    border-bottom: 0;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

const AttachmentTableContainer = styled.div`
  height: 80%;
  background: ${(props) => props.theme.brand.backgroundLevel3};
  padding: ${spacing.sp24};
`;

const StyledTable = styled.div`
  background: ${(props) => props.theme.brand.backgroundLevel4};
  height: 100%;
`;

export const CenterredSecondaryText = styled(SecondaryText)`
  display: block;
  text-align: center;
`;

export const AttachmentTable = <
  API_RESPONSE extends {
    Marker?: string;
  },
>({
  initiallyAttachedEntities,
  getAllEntitiesPaginatedQuery,
  getEntitiesFromResult,
  initialAttachmentOperations,
  onAttachmentsOperationsChanged,
}: AttachmentTableProps<API_RESPONSE>) => {
  //Desired attached entities and onAttachmentsOperationsChanged handling

  const [{ desiredAttachedEntities }, dispatch] = useReducer(
    (
      state: {
        desiredAttachedEntities: AttachableEntityWithPendingStatus[];
        attachmentsOperations: AttachmentOperation[];
      },
      action:
        | { action: AttachmentAction.ADD; entity: AttachableEntity }
        | { action: AttachmentAction.REMOVE; entity: AttachableEntity },
    ) => {
      switch (action.action) {
        case AttachmentAction.ADD:
          if (
            !state.desiredAttachedEntities.find(
              (entity) => entity.id === action.entity.id,
            )
          ) {
            const newAttachmentsOperations = [...state.attachmentsOperations];
            const existingOperationIndexOnThisEntity =
              state.attachmentsOperations.findIndex(
                (operation) => operation.entity.id === action.entity.id,
              );
            //When ADD, we check if it's already exist in operations. If so, we delete the previous operation and not proceed to the ADD.
            if (
              existingOperationIndexOnThisEntity !== -1 &&
              state.attachmentsOperations[existingOperationIndexOnThisEntity]
                .action === AttachmentAction.REMOVE
            ) {
              newAttachmentsOperations.splice(
                existingOperationIndexOnThisEntity,
                1,
              );
              const newState = {
                ...state,
                desiredAttachedEntities: [
                  { ...action.entity },
                  ...state.desiredAttachedEntities,
                ],
                attachmentsOperations: [...newAttachmentsOperations],
              };
              onAttachmentsOperationsChanged(newState.attachmentsOperations);
              return newState;
            } else {
              const newState = {
                ...state,
                desiredAttachedEntities: [
                  { ...action.entity, isPending: true },
                  ...state.desiredAttachedEntities,
                ],
                attachmentsOperations: [...newAttachmentsOperations, action],
              };
              onAttachmentsOperationsChanged(newState.attachmentsOperations);
              return newState;
            }
          }
          break;
        case AttachmentAction.REMOVE:
          if (
            state.desiredAttachedEntities.find(
              (entity) => entity.id === action.entity.id,
            )
          ) {
            const newDesiredAttachedEntities = [
              ...state.desiredAttachedEntities,
            ];
            newDesiredAttachedEntities.splice(
              state.desiredAttachedEntities.findIndex(
                (entity) => entity.id === action.entity.id,
              ),
              1,
            );
            const newAttachmentsOperations = [...state.attachmentsOperations];
            const existingOperationIndexOnThisEntity =
              state.attachmentsOperations.findIndex(
                (operation) => operation.entity.id === action.entity.id,
              );
            if (
              existingOperationIndexOnThisEntity !== -1 &&
              state.attachmentsOperations[existingOperationIndexOnThisEntity]
                .action === AttachmentAction.ADD
            ) {
              newAttachmentsOperations.splice(
                existingOperationIndexOnThisEntity,
                1,
              );
            } else if (
              existingOperationIndexOnThisEntity !== -1 &&
              state.attachmentsOperations[existingOperationIndexOnThisEntity]
                .action === AttachmentAction.REMOVE
            ) {
              return state;
            } else {
              newAttachmentsOperations.push(action);
            }
            const newState = {
              ...state,
              desiredAttachedEntities: newDesiredAttachedEntities,
              attachmentsOperations: newAttachmentsOperations,
            };
            onAttachmentsOperationsChanged(newState.attachmentsOperations);
            return newState;
          }
          break;
      }
      return state;
    },
    {
      desiredAttachedEntities: [
        ...initiallyAttachedEntities
          .filter(
            (attachedEntities) =>
              !initialAttachmentOperations.find(
                (op) => op.entity.id === attachedEntities.id,
              ),
          )
          .map((entity) => ({
            ...entity,
            isPending: false,
            action: null,
          })),
        ...initialAttachmentOperations
          .filter((op) => op.action !== AttachmentAction.REMOVE)
          .map((op) => ({
            ...op.entity,
            isPending: true,
            action: op.action,
          })),
      ],
      attachmentsOperations: initialAttachmentOperations,
    },
  );

  const resetRef = useRef<() => void | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const onSelectedItemChange = useCallback(
    ({ selectedItem }) => {
      if (selectedItem) {
        dispatch({ action: AttachmentAction.ADD, entity: selectedItem });
        if (resetRef.current) resetRef.current();
        if (searchInputRef.current) searchInputRef.current.blur();
      }
    },
    [resetRef],
  );

  //Search box and entities fetching logic

  const [
    { filteredEntities, numberOfFilteredEntities },
    dispatchEntitiesEvent,
  ] = useReducer(
    (
      state: {
        allEntities: AttachableEntity[];
        filteredEntities: AttachableEntity[];
        query: string;
        numberOfFilteredEntities: number;
      },
      action:
        | { type: 'RECEIVED_ENTITIES'; entities: AttachableEntity[] }
        | { type: 'FILTER_ENTITIES'; query?: string },
    ) => {
      switch (action.type) {
        case 'RECEIVED_ENTITIES': {
          const allFilteredEntities = action.entities.filter((item) =>
            item.name.toLowerCase().startsWith(state.query.toLowerCase()),
          );
          return {
            ...state,
            filteredEntities: allFilteredEntities.slice(0, 6),
            numberOfFilteredEntities: allFilteredEntities.length,
            allEntities: action.entities,
          };
        }
        case 'FILTER_ENTITIES': {
          const allFilteredEntities = state.allEntities.filter((item) =>
            item.name
              .toLowerCase()
              .startsWith(action.query?.toLowerCase() || ''),
          );
          return {
            ...state,
            query: action.query || '',
            filteredEntities: allFilteredEntities.slice(0, 6),
            numberOfFilteredEntities: allFilteredEntities.length,
          };
        }
      }
      return state;
    },
    {
      allEntities: [],
      filteredEntities: [],
      query: '',
      numberOfFilteredEntities: 0,
    },
  );

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    openMenu,
    getItemProps,
    reset,
  } = useCombobox({
    items: filteredEntities,
    onSelectedItemChange,
    onInputValueChange: ({ inputValue }) => {
      dispatchEntitiesEvent({ type: 'FILTER_ENTITIES', query: inputValue });
    },
  });

  const { firstPageStatus, status } = useAwsPaginatedEntities(
    {
      ...getAllEntitiesPaginatedQuery(),
      onPageSuccess: (entities) => {
        dispatchEntitiesEvent({ type: 'RECEIVED_ENTITIES', entities });
      },
    },
    getEntitiesFromResult,
  );

  useMemo(() => {
    resetRef.current = reset;
  }, [reset]);

  // UI styling states
  const [searchWidth, setSearchWidth] = useState('0px');
  const [searchInputIsFocused, setSearchInputIsFocused] = useState(false);

  return (
    <AttachmentTableContainer>
      <SearchBoxContainer
        {...getComboboxProps({
          ref: (element) => {
            if (element) {
              setSearchWidth(element.getBoundingClientRect().width - 2 + 'px');
            }
          },
        })}
      >
        {firstPageStatus === 'error' || firstPageStatus === 'loading' ? (
          <Tooltip
            overlay={
              firstPageStatus === 'error' ? (
                <>We failed to load the entities, hence search is disabled</>
              ) : firstPageStatus === 'loading' ? (
                <>Search is disabled while loading entities</>
              ) : (
                <></>
              )
            }
          >
            <Box display="flex" alignItems="center" width="100%" gap={8}>
              <StyledSearchInput
                placeholder="Search by entity name"
                {...getInputProps({
                  ref: (element) => {
                    if (element) searchInputRef.current = element;
                  },
                })}
                onFocus={() => {
                  openMenu();
                  setSearchInputIsFocused(true);
                }}
                onBlur={() => {
                  setSearchInputIsFocused(false);
                }}
                disableToggle
                disabled={
                  firstPageStatus === 'error' || firstPageStatus === 'loading'
                }
              />
              <Loader />
            </Box>
          </Tooltip>
        ) : (
          <StyledSearchInput
            placeholder="Search by entity name"
            {...getInputProps({
              ref: (element) => {
                if (element) searchInputRef.current = element;
              },
            })}
            onFocus={() => {
              openMenu();
              setSearchInputIsFocused(true);
            }}
            onBlur={() => {
              setSearchInputIsFocused(false);
            }}
            disableToggle
          />
        )}
      </SearchBoxContainer>
      <MenuContainer
        {...getMenuProps()}
        width={searchWidth}
        isOpen={isOpen}
        searchInputIsFocused={searchInputIsFocused}
      >
        {isOpen &&
          filteredEntities.map((item, index) => (
            <li key={`${item.id}${index}`} {...getItemProps({ item, index })}>
              {item.name}
            </li>
          ))}
        {isOpen && filteredEntities.length === 0 && status === 'loading' && (
          <li>Searching...</li>
        )}
        {isOpen && numberOfFilteredEntities > filteredEntities.length && (
          <li>
            <GentleEmphaseSecondaryText alignRight>
              There{' '}
              {numberOfFilteredEntities - filteredEntities.length === 1
                ? 'is'
                : 'are'}{' '}
              {numberOfFilteredEntities - filteredEntities.length} more{' '}
              {numberOfFilteredEntities - filteredEntities.length === 1
                ? 'entity'
                : 'entities'}{' '}
              matching your search. Suggestion: try more specific search
              expression.
            </GentleEmphaseSecondaryText>
          </li>
        )}
        {isOpen && filteredEntities.length === 0 && status === 'success' && (
          <li>
            <GentleEmphaseSecondaryText>
              No entities found matching your search.
            </GentleEmphaseSecondaryText>
          </li>
        )}
      </MenuContainer>
      <StyledTable>
        <Table
          columns={[
            {
              Header: 'Name',
              accessor: 'name',
              cellStyle: {
                minWidth: '20rem',
                marginLeft: '3rem',
              },
            },
            {
              Header: 'Attachment status',
              accessor: 'isPending',
              cellStyle: {
                flex: 1,
              },
              Cell: ({ value }: { value?: boolean }) => {
                return value ? 'Pending' : 'Attached';
              },
            },
            {
              Header: '',
              accessor: 'action',
              cellStyle: {
                textAlign: 'right',
                minWidth: '10rem',
                marginLeft: 'auto',
                marginRight: '0.5rem',
              },
              Cell: ({
                row: { original: entity },
              }: {
                row: { original: AttachableEntity };
              }) => (
                <InlineButton
                  onClick={() => {
                    dispatch({
                      action: AttachmentAction.REMOVE,
                      entity: {
                        name: entity.name,
                        id: entity.id,
                        type: entity.type,
                      },
                    });
                  }}
                  icon={<Icon name="Close" />}
                  label="Remove"
                  variant="danger"
                  disabled={!!entity.disableDetach}
                />
              ),
            },
          ]}
          data={desiredAttachedEntities.map((entity) => ({
            ...entity,
            isPending: entity.isPending || false,
            action: null,
          }))}
          defaultSortingKey="name"
        >
          <Table.SingleSelectableContent
            backgroundVariant="backgroundLevel4"
            rowHeight={rowHeight}
            separationLineVariant="backgroundLevel2"
          >
            {(rows) => (
              <>
                {desiredAttachedEntities.length === 0 && (
                  <CenterredSecondaryText>
                    No entities attached
                  </CenterredSecondaryText>
                )}
                {desiredAttachedEntities.length > 0 && rows}
              </>
            )}
          </Table.SingleSelectableContent>
        </Table>
      </StyledTable>
    </AttachmentTableContainer>
  );
};
