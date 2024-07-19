import { Icon } from '@scality/core-ui/dist/components/icon/Icon.component';
import { useLocation } from 'react-router-dom';
import { Warning } from './ui-elements/Warning';

function NoMatch() {
  const { pathname } = useLocation();
  const title = `No match for "${pathname}"`;
  return (
    <Warning
      centered={true}
      icon={<Icon name="Exclamation-triangle" size="5x" />}
      title={title}
    />
  );
}

export default NoMatch;
