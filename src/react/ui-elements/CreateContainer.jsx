import styled from 'styled-components';

const CreateContainer = styled.div`

    display: flex;
    flex-direction: column;

    max-width: 600px;
    margin: 10px;
    padding: 20px;
    background-color: #1c1c20;
    border-radius: 5px;
    text-transform:  capitalize;

    .title {
        display: flex;

        text-transform: uppercase;
        margin-bottom: 60px;
        font-size: 19px;
    }
    .input{
        display: flex;
        flex-direction: column;
        margin-bottom: 20px;
        .sc-input-wrapper{ width:100%; }
        .name {
            margin-bottom: 10px;
        }
        input{
            margin-bottom: 10px;
            width:90%;
        }
    }
    .footer {
      display: flex;
      justify-content: flex-end;

      text-transform: lowercase;
      margin-top: 60px;

      button{
          margin-left: 5px;
      }
    }
`;

export default CreateContainer;
