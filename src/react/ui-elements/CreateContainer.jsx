import styled from 'styled-components';

const CreateContainer = styled.div`

    display: flex;
    flex-direction: column;

    max-width: 600px;
    margin: 10px;
    padding: 20px;
    background-color: ${props => props.theme.brand.backgroundContrast1};
    border-radius: 5px;

    // TODO: fix inside core-ui
    .sc-select__single-value{
        width:100%;
    }

    .sc-title {
        display: flex;

        text-transform: uppercase;
        margin-bottom: 20px;
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
            margin-bottom: 10px;
            // width:90%;
        }
        input.form-check-input{
            width:auto;
        }
    }
    .footer {
      display: flex;
      justify-content: flex-end;

      text-transform: lowercase;
      margin-top: 40px;

      button{
          margin-left: 5px;
      }
    }

    .form-group{
        margin-top: 10px;
    }
`;

export default CreateContainer;
