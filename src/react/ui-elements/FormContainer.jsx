import { fontSize, padding } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

// WARNING: FormContainer is depreciated, use FormLayout components instead.
const FormContainer = styled.form`

    display: flex;
    flex-direction: column;

    max-width: 600px;
    margin: ${padding.small};
    padding: ${padding.large};
    background-color: ${props => props.theme.brand.primaryDark1};

    // TODO: fix inside core-ui
    .sc-select__single-value{
        width:100%;
    }

    .zk-form-title {
        display: flex;

        text-transform: uppercase;
        margin-bottom: 40px;
        font-size: ${fontSize.larger};
    }
    .sc-fieldset, fieldset{
        display: flex;
        flex-direction: column;
        border: 0;
        padding: 0;
        margin-top: ${padding.base};
        .sc-input-wrapper{
            width:100%;
        }
        label {
            margin-bottom: ${padding.small};
        }
        small {
            margin-bottom: ${padding.small};
        }

        input{
            margin-bottom: ${padding.smaller};
            // width:90%;
        }
        input.form-check-input{
            width:auto;
        }
    }

    .zk-form-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;

      text-transform: lowercase;
      margin-top: 40px;

      .zk-form-banner {
          width: calc(100% - 140px);
          height: 52px;
      }

      button{
          margin-left: ${padding.smaller};
      }
    }

    .form-group{
        margin-top: ${padding.small};
    }
`;

export default FormContainer;
