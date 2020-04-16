// @flow
import { Button, Modal } from '@scality/core-ui';
import { loadCredentials, networkAuthReset } from '../actions';
import type { Action } from '../../types/actions';
import type { AppState } from '../../types/state';
import type { DispatchAPI } from 'redux';
import React from 'react';
import { connect } from 'react-redux';

type DispatchProps = {
    reauth: () => void,
};

type StateProps = {
    needReauth: boolean,
    errorMessage: string | null,
};

type Props = StateProps & DispatchProps;

const DEFAULT_MESSAGE = 'We need to log you in periodically';

const ReauthDialog = (props: Props) => {
    const { needReauth, reauth, errorMessage } = props;
    if (!needReauth) {
        return null;
    }

    return (
        <Modal
            id="reauth-dialog-modal"
            close={reauth}
            footer={<div style={{display: 'flex', justifyContent: 'flex-end'}}> <Button outlined onClick={reauth} size="small" text={ errorMessage ? 'Retry' : 'Reload' }/> </div>}
            isOpen={true}
            title={errorMessage ? 'Authentication Error' : 'Your session has expired'}>
            <div style={{margin: '10px 0px 20px'}}>
                { errorMessage || DEFAULT_MESSAGE }
            </div>
        </Modal>
    );
};

function mapStateToProps(state: AppState): StateProps {
    return {
        needReauth: state.networkActivity.authFailure,
        errorMessage: state.uiErrors.errorType === 'byAuth' ?
            state.uiErrors.errorMsg : null,
    };
}

function mapDispatchToProps(dispatch: DispatchAPI<Action>): DispatchProps {
    return {
        reauth: () => {
            dispatch(networkAuthReset());
            dispatch(loadCredentials());
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ReauthDialog);
