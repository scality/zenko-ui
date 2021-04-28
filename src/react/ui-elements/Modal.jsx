import { Modal } from '@scality/core-ui';
import { padding } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

export const CustomModal = styled(Modal)`
    background-color: rgba(0,0,0,0.8);
    .sc-modal-content{
        background-color: ${props => props.theme.brand.backgroundLevel1};
        box-shadow: 0 0px 2px rgba(255, 255, 255, 0.3);
    }
    .sc-modal-body{
        margin: ${padding.small} 0px ${padding.large};
    }
    .sc-modal-footer{
      background-color: ${props => props.theme.brand.backgroundLevel4};
      display: flex;
      justify-content: flex-end;
      button{
          margin-left: ${padding.smaller};
      }
    }
`;

export const ModalBody = styled.div`
    max-width: 600px;
    line-height: 150%;
`;
