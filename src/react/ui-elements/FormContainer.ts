import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
// WARNING: FormContainer is depreciated, use FormLayout components instead.
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;

  max-width: 600px;
  margin: ${spacing.sp8};
  padding: ${spacing.sp20};
  background-color: ${(props) => props.theme.brand.backgroundLevel4};

  // TODO: fix inside core-ui
  .sc-select__single-value {
    width: 100%;
  }

  .zk-form-title {
    display: flex;

    text-transform: uppercase;
    margin-bottom: 40px;
    font-size: ${fontSize.larger};
  }
  .sc-fieldset,
  fieldset {
    display: flex;
    flex-direction: column;
    border: 0;
    padding: 0;
    margin-top: ${spacing.sp16};
    .sc-input-wrapper {
      width: 100%;
    }
    label {
      margin-bottom: ${spacing.sp8};
    }
    small {
      margin-bottom: ${spacing.sp8};
    }

    input {
      margin-bottom: ${spacing.sp4};
      // width:90%;
    }
    input.form-check-input {
      width: auto;
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

    button {
      margin-left: ${spacing.sp4};
    }
  }

  .form-group {
    margin-top: ${spacing.sp8};
  }
`;
export default FormContainer;
