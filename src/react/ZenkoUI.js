import {clearError, initIamClient, initS3Client, listBuckets} from './actions';
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
        // TODO: move them to a gobal action
        this.props.dispatch(initIamClient());
        this.props.dispatch(initS3Client());
        this.props.dispatch(listBuckets());
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
