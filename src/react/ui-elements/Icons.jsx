import React from 'react';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

const StyledIconTooltip = styled.i`
    color: ${props => props.theme.brand.buttonSecondary};
    margin-left: ${spacing.sp4};
`;

export const IconTooltip = () => <StyledIconTooltip className='fas fa-question-circle'/>;

export const Icon = {
    Tooltip: IconTooltip,
};
