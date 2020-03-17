import styled from 'styled-components';

const Head = styled.div`
  display: flex;

  color: #fff;
  margin: 10px;
  border-radius: 5px;
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
  .number{
      font-size: 4em;
      margin-top:10px;
  }
`;

export { Head, HeadLeft };
