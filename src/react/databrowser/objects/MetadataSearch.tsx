import { useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { Hint, Hints, HintsTitle } from '../../ui-elements/Input';
import {
  SearchButton,
  SearchMetadataContainer,
  SearchMetadataInputAndIcon,
  SearchValidationIcon,
} from '../../ui-elements/Table';
import {
  useOutsideClick,
  usePrefixWithSlash,
  useQueryParams,
} from '../../utils/hooks';
import { Icon, spacing } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';

export const METADATA_SEARCH_HINT_ITEMS = [
  {
    descr: 'files with extension ".pdf"',
    q: 'key like /pdf$/',
  },
  {
    descr: 'files bigger than 1MB',
    q: 'content-length > 1000000',
  },
  {
    descr: 'file names that contain scality (case insensitive)',
    q: 'key like /scality/i',
  },
  {
    descr: 'files with metadata field color set to green',
    q: 'x-amz-meta-color="green"',
  },
  {
    descr: 'files tagged with color blue',
    q: 'tags.color=blue',
  },
  {
    descr: 'PDF files (from content-type)',
    q: 'content-type=application/pdf',
  },
  {
    descr: 'file names that contain the word Report (case sensitive)',
    q: 'key like Report',
  },
  {
    descr: 'files waiting to be replicated',
    q: 'replication-status="PENDING"',
  },
];

const SearchMetadataInputContainer = styled.div`
  width: 100%;
  > div {
    width: 100%;
  }
`;
const SearchMetadataInput = styled(Input)`
  background-color: ${(props) => props.theme.backgroundLevel1};
  padding: 0px ${spacing.r32};
  max-height: ${spacing.r32};
  box-sizing: border-box;
`;
type Props = {
  isMetadataType: boolean;
  errorZenkoMsg: string | null | undefined;
};

const MetadataSearch = ({ isMetadataType, errorZenkoMsg }: Props) => {
  const [hintsShown, setHintsShown] = useState(false);
  const history = useHistory();
  const query = useQueryParams();
  const { pathname } = useLocation();
  const prefixWithSlash = usePrefixWithSlash();
  // hide hints if clicked on outside of element.
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  useOutsideClick(suggestionsRef, () => setHintsShown(false));
  const searchInput = query.get('metadatasearch');
  const [inputText, setInputText] = useState(searchInput || '');

  const handleChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inputText || prefixWithSlash) {
      return;
    }

    // Add metadatasearch in the query params
    query.set('metadatasearch', inputText);
    history.push(`${pathname}?${query.toString()}`);
  };

  const reset = (e) => {
    e.stopPropagation();
    setHintsShown(false);
    setInputText('');
    // Remove the medatasearch from the query params
    query.delete('metadatasearch');
    history.push(`${pathname}?${query.toString()}`);
  };

  const handleHintClicked = (q) => {
    setInputText(q);
    setHintsShown(false);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputClicked = () => {
    if (inputText || hintsShown) {
      return;
    }

    setHintsShown(true);
  };

  const isHidden = !isMetadataType && !errorZenkoMsg;

  return (
    <SearchMetadataContainer
      //@ts-expect-error fix this when you are working on it
      isHidden={prefixWithSlash && !searchInput ? 1 : 0}
      onSubmit={handleSubmit}
    >
      <SearchMetadataInputAndIcon>
        <SearchValidationIcon
          isMetadataType={isMetadataType}
          isError={!!errorZenkoMsg}
        />
        <SearchMetadataInputContainer>
          <SearchMetadataInput
            id="metadata-search-input"
            ref={inputRef}
            onChange={handleChange}
            placeholder="Metadata Search"
            value={inputText}
            onClick={handleInputClicked}
          />
        </SearchMetadataInputContainer>

        <Icon
          name="Times-circle"
          style={{
            position: 'absolute',
            visibility: isHidden ? 'hidden' : 'visible',
            right: '10px',
            cursor: 'pointer',
          }}
          //@ts-expect-error Need to improve typing on core-ui for including the event
          onClick={reset}
        />
      </SearchMetadataInputAndIcon>
      {hintsShown && !inputText && (
        <Hints ref={suggestionsRef}>
          <HintsTitle> Suggestions </HintsTitle>
          {METADATA_SEARCH_HINT_ITEMS.map((h) => {
            return (
              <Hint key={h.q} onClick={() => handleHintClicked(h.q)}>
                {' '}
                {h.descr}{' '}
              </Hint>
            );
          })}
        </Hints>
      )}
      <SearchButton
        variant="primary"
        type="submit"
        label="Search"
        disabled={!inputText}
      />
    </SearchMetadataContainer>
  );
};

export default MetadataSearch;
