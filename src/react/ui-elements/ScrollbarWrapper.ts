import styled, { css } from 'styled-components';
const ScrollbarWrapper = styled.div`
  ${(props) => {
    const brand = props.theme.brand;
    return css`
      * {
        // Chrome / Safari / Edge
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: ${brand.backgroundLevel1};
        }

        ::-webkit-scrollbar-thumb {
          width: 4px;
          height: 4px;
          background: ${brand.buttonSecondary};
          border-radius: 4px;
          -webkit-border-radius: 4px;
          background-clip: padding-box;
          border: 2px solid rgba(0, 0, 0, 0);
        }

        ::-webkit-scrollbar-button {
          width: 0;
          height: 0;
          display: none;
        }
        ::-webkit-scrollbar-corner {
          background-color: transparent;
        }

        // Firefox
        scrollbar-color: ${brand.buttonSecondary} ${brand.backgroundLevel1};
        scrollbar-width: thin;
      }
    `;
  }}
`;
export default ScrollbarWrapper;