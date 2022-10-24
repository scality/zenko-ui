import { HeadCenter, HeadTitle } from '../ui-elements/ListLayout';
import { useParams } from 'react-router-dom';
import { Icon } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useTheme } from 'styled-components';

function AccountHead() {
  const theme = useTheme();
  const { accountName: accountNameParam } = useParams();
  return (
    <Box display="flex" justifyContent="space-between" gap={spacing.sp16}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="100%"
        backgroundColor={theme.brand.backgroundLevel1}
        borderColor={theme.brand.infoPrimary}
        borderStyle="solid"
        borderWidth={spacing.sp1}
        width={80}
        height={80}
      >
        <Icon name="Account" color="infoPrimary" size="2x" />
      </Box>
      <HeadCenter>
        <HeadTitle> {accountNameParam} </HeadTitle>
      </HeadCenter>
    </Box>
  );
}

export default AccountHead;
