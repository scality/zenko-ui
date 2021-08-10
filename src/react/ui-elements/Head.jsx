import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

// WARNING: Head and HeadLeft are depreciated, use ListLayout.Head components instead.
const Head = styled.div`
  display: flex;

  color: #fff;
  margin: ${spacing.sp8};
  height: 130px;
  background: repeating-radial-gradient(
    circle at 5% 5%,
    #212127,
    #212127 3px,
    #32323a 3px,
    #32323a 15px
  );
`;

const HeadLeft = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;


  width: 130px;
  background-color: #00000069;

  .title {
      margin-top: ${spacing.sp8};
      font-size: ${fontSize.large};
  }
  .number{
      font-size: 4em;
      margin-top: ${spacing.sp8};
  }
`;

export { Head, HeadLeft };
