import { LoaderContainer } from './Container';
import { Loader as LoaderCoreUI } from '@scality/core-ui';

const Loader = ({ children }: { children: React.ReactNode }) => (
  <LoaderContainer>
    <LoaderCoreUI size="massive">{children}</LoaderCoreUI>
  </LoaderContainer>
);

export default Loader;
