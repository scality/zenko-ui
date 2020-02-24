import {clearError, initIamClient} from './actions';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import React from 'react';
import Users from './user/Users';
import { connect } from 'react-redux';
import styled from 'styled-components';

const Layout = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: scroll;
  background-color: #0c0c0d;
`;

class ZenkoUI extends React.Component {
    constructor(props){
        super(props);
    }

    componentDidMount() {
        this.props.dispatch(initIamClient());
    }

    render(){
        return (
            <Layout>
                { this.props.isLoaded && <Users /> }
                <ErrorHandlerModal
                    show={this.props.showError}
                    close={() => this.props.dispatch(clearError())} >
                    {this.props.errorMessage}
                </ErrorHandlerModal>
            </Layout>
        );
    }
}

function mapStateToProps(state) {
    return {
        showError: !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byModal',
        errorMessage: state.uiErrors.errorMsg,
        // needReauth: state.networkActivity.authFailure,
        isLoaded: !!state.iamClient.client,
    };
}


export default connect(mapStateToProps)(ZenkoUI);
