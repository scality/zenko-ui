import { Input } from '@scality/core-ui';

import React from 'react';

function ReplicationCreateForm() {
    return <div>
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
    </div>;
}

export default ReplicationCreateForm;
