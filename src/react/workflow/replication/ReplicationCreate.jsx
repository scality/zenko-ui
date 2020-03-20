import { Button, Input } from '@scality/core-ui';
import CreateContainer from '../../ui-elements/CreateContainer';
import React from 'react';

function ReplicationCreate(props){
    return <CreateContainer>
        <div className='title'> create replication </div>
        <div className='input'>
            <div className='name'> comment </div>
            <Input
                type='text'
                name='comment'
                placeholder='Comment'
                // onChange={this.handleChange}
                // value={this.state.userName}
                autoComplete='off' />
        </div>
        <div className='footer'>
            <Button outlined onClick={props.redirect} text='Cancel'/>
            <Button outlined onClick={props.submit} text='Add'/>
        </div>
    </CreateContainer>;
}

export default ReplicationCreate;
