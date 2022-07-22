import { Modal } from '@scality/core-ui';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
export const CustomModal = styled(Modal)`
  background-color: rgba(0, 0, 0, 0.8);
  .sc-modal-content {
    background-color: ${(props) => props.theme.brand.backgroundLevel1};
    box-shadow: 0 0px ${spacing.sp2} rgba(255, 255, 255, 0.3);
  }
  .sc-modal-body {
    margin: ${spacing.sp8} 0px ${spacing.sp20};
  }
  .sc-modal-footer {
    background-color: ${(props) => props.theme.brand.backgroundLevel4};
    display: flex;
    justify-content: flex-end;
    button {
      margin-left: ${spacing.sp4};
    }
  }
`;
export const ModalBody = styled.div`
  max-width: 80rem;
  line-height: 150%;
`;
