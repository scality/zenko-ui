import { Button } from '@scality/core-ui';
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

function StorageMonitor(props) {
    return <div>
        <Button outlined text="Add storage location" onClick={() => props.redirect('/monitor/location/editor')}/>
    </div>;
}

const mapDispatchToProps = (dispatch) => {
    return {
        redirect: path => dispatch(push(path)),
    };
};

export default connect(null, mapDispatchToProps)(StorageMonitor);
