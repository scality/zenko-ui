// @noflow
import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { Tooltip } from '@scality/core-ui';
import { ReactNode } from 'react';
import { IconHelp } from './Help';
// TEMPLATE
//
// <Table>
//     <T.Body>
//         <T.Group>
//             <T.GroupName>
//                 General
//             </T.GroupName>
//             <T.GroupContent>
//                 <T.Row>
//                     <T.Key> Name </T.Key>
//                     <T.Value> <Input /> </T.Value>
//                 </T.Row>
//             </T.GroupContent>
//         </T.Group>
//
//         <T.Group>
//             <T.GroupName>
//                 Source
//             </T.GroupName>
//             <T.GroupContent>
//                 <T.Row>
//                     <T.Key> Source Bucket </T.Key>
//                     <T.Value> <Input /> </T.Value>
//                 </T.Row>
//                 <T.Row>
//                     <T.Key> Prefix (optional) </T.Key>
//                     <T.Value> <Input /> </T.Value>
//                 </T.Row>
//             </T.GroupContent>
//         </T.Group>
//     </T.Body>
// </Table>
export const Title = styled.div`
  display: flex;

  text-transform: capitalize;
  margin-bottom: ${spacing.sp24};
  font-size: ${fontSize.larger};
`;
export const Subtitle = styled(Title)`
  font-size: ${fontSize.large};
`;
export const Body = styled.form`
  display: flex;
  flex-direction: column;
`;
export const Groups = styled.div`
  display: flex;
  flex-direction: column;

  max-width: 450px;
`;
export const Group = styled.div`
  margin-bottom: ${spacing.sp24};
`;
export const GroupName = styled.div`
  font-weight: bold;
  margin-bottom: ${spacing.sp8};
`;
export const GroupContent = styled.div`
  display: flex;
  flex-direction: column;
`;
export const Row = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: ${spacing.sp4};
  min-height: ${spacing.sp24};
`;
const RawKey = styled.div<{ principal?: boolean; required?: boolean }>`
  color: ${(props) =>
    props.principal ? props.theme.brand.text : props.theme.brand.textSecondary};
  font-weight: ${(props) => (props.principal ? 'bold' : 'normal')};
  ${(props) =>
    props.required
      ? `
        &:after {
            content: '*';
        }
    `
      : ''}
`;
export const Key = styled(RawKey)`
  && {
    flex: 1 1 ${(props) => props.size || 35}%;
  }
`;
const KeyContainer = styled.div<{ size?: number }>`
  display: flex;
  flex: 1 1 ${(props) => props.size || 35}%;
`;
type KeyTooltipProps = {
  children: ReactNode;
  tooltipMessage: string;
  tooltipWidth: string;
  required?: boolean;
  principal?: boolean;
  size?: number;
};
export const KeyTooltip = ({
  children,
  tooltipMessage,
  tooltipWidth,
  size,
  ...props
}: KeyTooltipProps) => (
  <KeyContainer size={size}>
    <RawKey {...props}> {children} </RawKey>
    {tooltipMessage && (
      <IconHelp
        tooltipMessage={tooltipMessage}
        tooltipWidth={tooltipWidth}
      />
    )}
  </KeyContainer>
);
export const Value = styled.div`
  flex: 1 1 65%;
  flex-direction: column;
  i {
    margin-right: ${spacing.sp8};
  }
`;
export const GroupValues = styled.div`
  display: flex;
  flex: 1 1 65%;
  justify-content: space-between;
  align-items: center;
`;
export const ErrorContainer = styled.div`
  position: absolute;
`;
const Table = styled.div`
  width: 100%;
`;
export const Header = styled.div`
  display: ${(props) => (props.isRemoved ? 'none' : 'flex')};
  flex-direction: row;
  justify-content: space-between;
`;
export const BannerContainer = styled.div`
  margin-right: ${spacing.sp8};
  width: 50%;
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
`;
export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;

  margin-top: ${spacing.sp8};
  margin-bottom: ${spacing.sp8};
`;
export const ExtraCell = styled.div`
  margin-left: ${spacing.sp20};
`;
export default Table;
