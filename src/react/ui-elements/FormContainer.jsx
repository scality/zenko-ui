import styled from 'styled-components';

// WARNING: FormContainer is depreciated, use FormLayout components instead.
const FormContainer = styled.form`

    display: flex;
    flex-direction: column;

    max-width: 600px;
    margin: 10px;
    padding: 20px;
    background-color: ${props => props.theme.brand.primaryDark1};
    border-radius: 5px;

    // TODO: fix inside core-ui
    .sc-select__single-value{
        width:100%;
    }

    .zk-form-title {
        display: flex;

        text-transform: uppercase;
        margin-bottom: 40px;
        font-size: 19px;
    }
    .sc-fieldset, fieldset{
        display: flex;
        flex-direction: column;
        border: 0;
        padding: 0;
        margin-top: 15px;
        .sc-input-wrapper{
            width:100%;
        }
        label {
            margin-bottom: 10px;
        }
        small {
            margin-bottom: 10px;
        }

        input{
            margin-bottom: 5px;
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
          margin-left: 5px;
      }
    }

    .form-group{
        margin-top: 10px;
    }
`;

export default FormContainer;
