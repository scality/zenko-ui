import { spacing } from '@scality/core-ui';
import { fontSize } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
// TEMPLATE
//
// <Table>
//     <Body>
//         <Row>
//             <Key> key1 </Key>
//             <Value> value1 </Value>
//             <ExtraCell> <Clipboard text="value1"/> </ExtraCell>
//         </Row>
//         <Row>
//             <Key> key2 </Key>
//             <Value> value2 </Value>
//         </Row>
//     </Body>
// </Table>
export const Body = styled.tbody``;
export const Row = styled.tr``;
export const Key = styled.td`
  white-space: nowrap;
  padding: ${spacing.r8} 0px;
  color: ${(props) => props.theme.textSecondary};
`;
export const Value = styled.td`
  padding-left: 40px;
  max-width: 420px;
  width: 420px;
  min-width: 220px;
  word-break: break-word;
`;
export const Title = styled.div`
  font-size: ${fontSize.larger};
  font-weight: bold;
  margin: ${spacing.r20} 0 ${spacing.r20} 0;
`;
export const ExtraCell = styled.td`
  padding-left: ${spacing.r20};
  min-width: 40px;
`;
export const Container = styled.div`
  display: block;
  width: fit-content;
  margin: ${spacing.r16} 0 0 30px;
`;
const Table = styled.table`
  max-width: 600px;
  border-spacing: 0px;
  width: 100%;
`;
export const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.r16};
`;
export default Table;
