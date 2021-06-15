// @flow
import React from 'react';
import styled from 'styled-components';

const Title = styled.div`
    color: #567;
`;

const Try = ({ name }: { name: string }) => {
    return <Title> { name } </Title>;
    // return <div> FAKE NAME </div>;
};

const ForTestingOnly = () => {
    return <div>
        <div> DOES IT WORK? YES </div>
        <Try name='n2b'/>
    </div>;
};

export default ForTestingOnly;
