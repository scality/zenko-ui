import * as S from '../ui-elements/ListLayout';
import AccountList from './AccountList';
import React from 'react';

const Accounts = () => {
    return <S.ListContainer>
        <S.ListLeftSection>
            <AccountList/>
        </S.ListLeftSection>
        <S.ListRightSection>
            <S.ListRightHead>
                RIGHT HEAD
            </S.ListRightHead>
            <S.ListRightContent>
                RIGHT CONTENT
            </S.ListRightContent>
        </S.ListRightSection>
    </S.ListContainer>;
};

export default Accounts;
