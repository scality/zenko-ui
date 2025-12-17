import { useState } from 'react';
import { Account, AccountKey } from '../../../types/account';
import { useAuthGroups } from '../../utils/hooks';
import AccountInfo from './properties/AccountInfo';
import AccountKeys from './properties/AccountKeys';
import SecretKeyModal from './properties/SecretKeyModal';
import { AutoSizer } from 'react-virtualized';
import styled, { CSSProperties } from 'styled-components';
type Props = {
  account: Account;
};
const Container = styled.div<{
  height: CSSProperties['height'];
  width: CSSProperties['width'];
}>`
  display: flex;
  flex-direction: column;
  height: ${(props) => props.height}px;
  width: ${(props) => props.width}px;
`;

function Properties({ account }: Props) {
  const { isStorageManager } = useAuthGroups();
  const [isSecretKeyModalOpen, setIsSecretKeyModalOpen] = useState(false);
  const [accountKey, setAccountKey] = useState<AccountKey | null>(null);

  const handleOpenModal = () => setIsSecretKeyModalOpen(true);
  const handleCloseModal = () => {
    setIsSecretKeyModalOpen(false);
    setAccountKey(null);
  };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Container height={height} width={width}>
          <AccountInfo account={account} />
          {isStorageManager && (
            <AccountKeys account={account} onOpenKeyModal={handleOpenModal} />
          )}
          <SecretKeyModal
            account={account}
            isOpen={isSecretKeyModalOpen}
            accountKey={accountKey}
            onClose={handleCloseModal}
            onKeyCreated={setAccountKey}
          />
        </Container>
      )}
    </AutoSizer>
  );
}

export default Properties;
