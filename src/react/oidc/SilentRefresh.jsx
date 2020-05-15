import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { signinSilentCallback } from '../actions';

function SilentRefresh(props) {
    useEffect(() => {
        props.refresh();
    },[]);

    return <div>
        SIGN IN SILENT
    </div>;
}

function mapDispatchToProps(dispatch) {
    return {
        refresh: () => dispatch(signinSilentCallback()),
    };
}

export default connect(null, mapDispatchToProps)(SilentRefresh);
