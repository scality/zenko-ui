import { Modal } from '@scality/core-ui';
import styled from 'styled-components';

export const CustomModal = styled(Modal)`
    background-color: rgba(0,0,0,0.8);
    .sc-modal-content{
        box-shadow: 0 0px 2px rgba(255, 255, 255, 0.3);
    }
    .sc-modal-body{
        margin: 10px 0px 20px;
    }
    .sc-modal-footer{
      display: flex;
      justify-content: flex-end;
      button{
          margin-left: 5px;
      }
    }
`;
