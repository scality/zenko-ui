import { Button, Input, Select } from '@scality/core-ui';
import React, { useState } from 'react';
import CreateContainer from '../../ui-elements/CreateContainer';
// import ReplicationCreateForm from './ReplicationCreateForm';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { saveReplication } from '../../actions/replication';

function newReplicationForm() {
    return {
        streamName: '',
        streamVersion: 1,
        streamId: '',
        enabled: true,
        sourceBucket: '',
        sourcePrefix: '',
        destinationLocations: [],
        preferredReadLocation: null,
    };
}

function ReplicationCreate(props){

    const [stream, setStream] = useState(newReplicationForm());

    const onChange = (r) => {
        setStream(r);
    }

    const save = (e) => {
        if (e) {
            e.preventDefault();
        }
        props.saveReplicationStream(stream);
    }

    const cancel = () => {
        props.redirect('/workflow');
    }

    const selectSourceOptions = () => {
        console.log('props.bucketLis!!!', props.bucketList);
        const buckets = props.bucketList.map(b => {
            return {
                label: b.name,
                title: b.name,
                value: b.name,
                location: b.location,
            };
        });

        // return buckets;

        return buckets;

        // [{
        //     'data-cy': 'Item_0',
        //     label: 'Item 0',
        //     title: 'Item 0',
        //     value: 0,
        // }]
    }


    return <CreateContainer>
        <div className='title'> create replication </div>
        <div>
            <div className='input'>
                <div className='name'> source </div>
                <Select
                    name="default_select"
                    noOptionsMessage={function noRefCheck(){}}
                    onChange={function noRefCheck(){}}
                    options={selectSourceOptions()}
                    placeholder="Select a bucket"
                />
            </div>
        </div>
        <div className='footer'>
            <Button outlined onClick={cancel} text='Cancel'/>
            <Button outlined onClick={save} text='Save'/>
        </div>
    </CreateContainer>;
}


function mapStateToProps(state) {
    console.log('state!!!', state);
    return {
        bucketList: state.stats.bucketList,
        streams: state.configuration.latest.replicationStreams,
        locations: state.configuration.latest.locations,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        saveReplicationStream: (r) => dispatch(saveReplication(r)),
        redirect: (path) => dispatch(push(path)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ReplicationCreate);
