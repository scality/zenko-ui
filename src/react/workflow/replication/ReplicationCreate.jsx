import { Button, Input, MultiSelect, Select } from '@scality/core-ui';
import React, { useState } from 'react';
import { convertToReplicationStream, generateStreamName, newReplicationForm } from './utils';
import CreateContainer from '../../ui-elements/CreateContainer';
// import ReplicationCreateForm from './ReplicationCreateForm';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { saveReplication } from '../../actions/replication';

function ReplicationCreate(props){

    const [stream, setStream] = useState(newReplicationForm());

    const save = (e) => {
        if (e) {
            e.preventDefault();
        }
        let streamName = stream.streamName;
        if (!streamName && stream.sourceBucket && stream.destinationLocations && stream.destinationLocations.length) {
            streamName = generateStreamName(stream.sourceBucket, stream.destinationLocations);
        }
        const s = { ...stream, streamName};
        console.log('FINAL FORM stream  s!!!', s);
        // props.saveReplicationStream(convertToReplicationStream(s));
    }

    const cancel = () => {
        props.redirect('/workflow');
    }

    const handleInputChange = (e) => {
        const s = {
            ...stream,
            [e.target.name]: e.target.value,
        };
        setStream(s);
    }

    // BUCKET SOURCE
    const handleSelectChange = (e) => {
        if (!e) {
            return;
        }
        setStream({ ...stream, sourceBucket: e.value });
    };

    const selectSourceOptions = () => {
        const bucketsUsedForReplication = props.streams.map(
            stream => stream.source.bucketName);
        console.log('bucketsUsedForReplication!!!', bucketsUsedForReplication);
        const buckets = props.bucketList.map(b => {
            return {
                label: b.name,
                title: b.name,
                value: b.name,
                location: b.location,
                // TODO: DISABLE IF NOT SUPPORT REPLICATION SOURCE
                isDisabled: bucketsUsedForReplication.indexOf(b.name) > -1,
                // isDisabled: false,
            };
        });
        console.log('buckets!!!', buckets);
        return buckets;
    };

    // DESTINATION LOCATION

    const multipleSelectOptions = () => {
        // return Object.keys(this.props.locations)
        //     .filter(n => {
        //         const locationType = this.props.locations[n].locationType;
        //         return storageOptions[locationType].supportsReplicationTarget &&
        //         this.props.destinationLocations.every((location => location.name !== n));
        //     }).map(n => {
        //         return {
        //             value: n,
        //             label: n,
        //         };
        //     });
        return Object.keys(props.locations)
            .filter(n => {
                return stream.destinationLocations.every((location => location.name !== n));
            })
            .map(n => {
                return {
                    value: n,
                    label: n,
                };
            });
    };

    const addDestinationLocation = (l) => {
        const destinationLocations = [
            ...stream.destinationLocations,
            { name: l.label, storageClass: 'standard'},
        ];
        const s = {
            ...stream,
            destinationLocations,
        };
        setStream(s);
    };

    const onItemRemove = label => {
        const destinationLocations = stream.destinationLocations.filter(d => d.name !== label);
        setStream({...stream, destinationLocations});
    };

    const onFavoriteClick = label => {
        setStream({...stream, preferredReadLocation: label});
    };

    const isFavorite = locationName => {
        return stream.preferredReadLocation === locationName;
    };

    const destinationLocationsItems = () => {
        return stream.destinationLocations.map(d => {
            return {
                // description: d.label,
                isFavorite: isFavorite(d.name),
                label: d.name,
                onFavoriteClick: onFavoriteClick,
                onItemRemove: onItemRemove,
                // onSelect: function noRefCheck(){},
                // selected: true,
            };
        });
    };


    return <CreateContainer>
        <div className='title'> create replication </div>
        <div>
            <div className='input'>
                <div className='name'> source </div>
                <Select
                    name="default_select"
                    noOptionsMessage={function noRefCheck(){}}
                    onChange={handleSelectChange}
                    options={selectSourceOptions()}
                    placeholder="Select a bucket"
                    isOptionDisabled={(option) => { console.log('option!!!', option); return option.isDisabled === true }}
                />
            </div>
            <div className='input'>
                <div className='name'> destination location: </div>
                <MultiSelect
                    items={destinationLocationsItems()}
                    onItemRemove={function noRefCheck(){}}
                    search={{
                        // onAdd: (e) => { console.log('onAdd e=> ', e) },
                        onSelect: addDestinationLocation,
                        options: multipleSelectOptions(),
                        placeholder: 'Select location to add',
                        selectedOption: null,
                    }}
                />
            </div>
            <div className='input'>
                <div className='name'> Only apply to objects with prefix (optional)</div>
                <Input
                    type='text'
                    name='sourcePrefix'
                    placeholder='assets/images/'
                    onChange={handleInputChange}
                    value={stream.prefix}
                    autoComplete='off' />
            </div>
        </div>
        <div className='footer'>
            <Button outlined onClick={cancel} text='Cancel'/>
            <Button outlined onClick={save} text='Save'/>
        </div>
    </CreateContainer>;
}


function mapStateToProps(state) {
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
