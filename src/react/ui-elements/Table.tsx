import { fontSize } from '@scality/core-ui/dist/style/theme';

import { spacing, SecondaryText, Wrap, Icon } from '@scality/core-ui';
import { Box, Button, Input } from '@scality/core-ui/dist/next';
import { Link } from 'react-router-dom';

import styled from 'styled-components';
import React from 'react';
// TEMPLATE
//
// <Table>
//     <T.Head>
//         <T.HeadRow>
//             <T.HeadCell> name </T.HeadCell>
//             <T.HeadCell> age </T.HeadCell>
//         </T.HeadRow>
//     </T.Head>
//     <T.Body>
//         <T.Row>
//             <T.Cell> bart </T.Cell>
//             <T.Cell> 43 </T.Cell>
//         </T.Row>
//         <T.Row>
//             <T.Cell> lisa </T.Cell>
//             <T.Cell> 44 </T.Cell>
//         </T.Row>
//     </T.Body>
// </Table>
type TableHeaderWrapperProps = {
  search?: React.ReactNode;
  actions?: React.ReactNode;
};

export const TableHeaderWrapper = ({
  search,
  actions,
}: TableHeaderWrapperProps) => {
  return (
    <Wrap padding={spacing.r16}>
      <Box>{search}</Box>
      <Box gap="r16">{actions}</Box>
    </Wrap>
  );
};

export const Container = styled.div`
  display: flex;
  flex: 1;
  margin-top: ${spacing.r16};
  width: 100%;
  height: 100%;
  flex-direction: column;
`;
// * table head
export const Head = styled.thead`
  border-bottom: ${spacing.r1} solid ${(props) => props.theme.backgroundLevel1};
`;
export const HeadRow = styled.tr`
  align-items: center;
  width: 100%;
  cursor: pointer;

  // following is needed to display scroll bar onto the table
  display: table;
  table-layout: fixed;
`;
export const HeadCell = styled.th`
  text-align: left;
  padding: ${spacing.r16};
`;

// * table body
export const Body = styled.tbody`
  // following is needed to display scroll bar onto the table
  display: block;
  overflow: auto;
`;
export const BodyWindowing = styled.tbody`
  flex: 1;
`;
export const Row = styled(HeadRow)`
  // it's better to use 1px instead of spacing.r1, otherwise the border of some rows
  // can look different cause of subpixel positioning
  border-bottom: 1px solid ${(props) => props.theme.backgroundLevel1};
  &:hover {
    background-color: ${(props) => props.theme.backgroundLevel3};
  }
  cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
  box-sizing: border-box;
  border-right: ${spacing.r4} solid transparent;

  ${(
    //@ts-expect-error fix this when you are working on it
    { isSelected, theme },
  ) =>
    isSelected &&
    `
        background-color: ${theme.highlight};
        border-right: ${spacing.r4} solid ${theme.selectedActive};
    `}
`;
export const Cell = styled.td<{ shade?: boolean }>`
  vertical-align: middle;
  color: ${(props) =>
    props.shade ? props.theme.infoPrimary : props.theme.textPrimary};
  padding: ${spacing.r4} ${spacing.r16} ${spacing.r4} ${spacing.r16};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;
export const CellLink = styled(Link)`
  color: ${(props) => props.theme.textLink};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
export const CellClick = styled.span`
  color: ${(props) => props.theme.textLink};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
export const CellA = styled.a`
  color: ${(props) => props.theme.textLink};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
// * table search
export const SearchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-right: ${spacing.r16};
  padding-left: ${spacing.r16};

  button {
    margin-left: auto;
  }
`;
export const Search = styled.div`
  display: flex;
  flex: 0 0 auto;
`;
export const SearchMetadataContainer = styled.form<{ isHidden?: boolean }>`
  flex: 1 0 auto;
  display: flex;
  max-width: 600px;
  margin-right: ${spacing.r20};
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
`;
export const SearchMetadataInputAndIcon = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex: 1 0 auto;
  margin-right: ${spacing.r4};
  align-items: center;
`;
export const ExtraButton = styled(Button)`
  flex: 0 0 auto;
`;
export const Resizer = styled.div`
  height: 100%;
`;
export const Actions = styled.div`
  text-align: right;
`;
export const ActionButton = styled(Button)`
  margin-left: ${spacing.r4};
`;
export const InlineButton = styled(Button)`
  height: ${spacing.r24};
`;
export const AccountSelectorButton = styled(Button)<{ bigButton?: boolean }>`
  height: ${(props) => (props.bigButton ? spacing.r32 : spacing.r24)};
`;
export const Title = styled.div`
  font-size: ${fontSize.larger};
  font-weight: bold;
  margin: ${spacing.r20} 0 ${spacing.r20} 0;
`;
const Table = styled.table`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  border-collapse: collapse;
`;
// specific to listobject/md search
export const ContainerWithSubHeader = styled(Container)`
  height: 100%;
  margin-top: 0px;
`;

type Props = {
  isMetadataType: boolean;
  isError: boolean;
};
export const SearchValidationIcon = ({ isMetadataType, isError }: Props) => {
  const style = {
    position: 'absolute' as const,
    left: '10px',
    marginLeft: `${spacing.r4}`,
  };
  if (isError) {
    return <Icon name="Close" color="statusCritical" style={style} />;
  }

  if (isMetadataType) {
    return <Icon name="Check" color="statusHealthy" style={style} />;
  }

  return <Icon name="Search" color="infoPrimary" style={style} />;
};
export const SearchButton = styled(Button)`
  flex: 0 0 auto;
`;
export const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-left: ${spacing.r16};
  padding-right: ${spacing.r16};
`;
export const ButtonContainer = styled.div`
  display: flex;
  flex: 0 0 auto;

  & > * {
    margin-left: ${spacing.r4};
  }
`;
export const SubHeaderContainer = styled.div<{ isHidden?: boolean }>`
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
  margin-left: ${spacing.r4};
`;
export const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;
export const GentleEmphaseSecondaryText = styled(SecondaryText)<{
  alignRight?: boolean;
}>`
  font-style: italic;
  ${(props) =>
    props.alignRight
      ? `
    text-align: right;
    display: block;
  `
      : ''}
`;
export default Table;
