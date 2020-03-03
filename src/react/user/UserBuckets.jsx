import { CollapsiblePanel } from '@scality/core-ui';
import React from 'react';
import { connect } from 'react-redux';

class UserBuckets extends React.Component{
    render(){
        return <div>
            <CollapsiblePanel
                expanded
                headerItems={[
                    <i key='bucketName1' className="fas fa-carrot" />,
                    'bucketName1',
                ]}
                onHeaderClick={function noRefCheck(){}}
            >
              orange
            </CollapsiblePanel>
        </div>;
    }
}

function mapStateToProps(state){
    return {
        buckets: state.bucket.list,
    };
}

export default connect(mapStateToProps)(UserBuckets);
