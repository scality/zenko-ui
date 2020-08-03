// @noflow
import { Loader } from '@scality/core-ui';
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

type Props = {
    working: boolean,
    message?: string,
};

const ActivityContainer = styled.div`
    position: fixed;
    bottom: 0px;
    right: 0px;
    padding: 1em;
    margin: 2em;
    background-color: #6a7b92;
    color: white;
    border-radius: 6px;
    vertical-align: 50%;
    z-index: 1100;

    .sc-loader{
      margin-right: 1em;
      float: left;
    }
`;

const Activity = ({ working, message }: Props) => {
    if (!working) {
        return null;
    }
    return (
        <ActivityContainer id="activity-message">
            <Loader size="base"/>
            { message || 'Working...'}
        </ActivityContainer>
    );
};

// function mapStateToProps(state: AppState) {
//     return {
//         // working: state.networkActivity.counter > 0,
//         // message: state.networkActivity.messages.first(),
//     };
// }

export default connect()(Activity);
