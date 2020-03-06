import { CollapsiblePanel } from '@scality/core-ui';
import React from 'react';

class UserBucket extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
        };
    }

    expand = e => {
        if (e) {
            e.preventDefault();
        }
        this.setState({
            expanded: !this.state.expanded,
        });
    }

    render(){
        // https://aws.amazon.com/blogs/security/iam-policies-and-bucket-policies-and-acls-oh-my-controlling-access-to-s3-resources/
        return <CollapsiblePanel
            expanded={this.state.expanded}
            headerItems={[
                <i key='bucketName1' className="fas fa-shield-alt" />,
                this.props.bucket.Name,
            ]}
            onHeaderClick={this.expand}
        >
            {this.props.bucket.Name}
        </CollapsiblePanel>;
    }
}

export default UserBucket;
