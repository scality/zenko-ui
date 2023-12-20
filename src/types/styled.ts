import 'styled-components';
import { CoreUITheme } from '@scality/core-ui/dist/style/theme';

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends CoreUITheme {}
}
