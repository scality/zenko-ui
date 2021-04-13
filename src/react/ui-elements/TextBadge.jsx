import { fontSize, padding } from '@scality/core-ui/dist/style/theme';
import { TextBadge as BasicTextBadge } from '@scality/core-ui';
import styled from 'styled-components';

export const TextBadge = styled(BasicTextBadge)`
    padding: ${padding.smaller} ${padding.smaller};
    margin: 0 ${padding.small} 0 ${padding.small};
    font-size: ${fontSize.small};
`;
