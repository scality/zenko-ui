import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    brand: {
      statusHealthy: string;
      statusWarning: string;
      statusCritical: string;
      selectedActive: string;
      highlight: string;
      border: string;
      buttonPrimary: string;
      buttonSecondary: string;
      buttonDelete: string;
      infoPrimary: string;
      infoSecondary: string;
      backgroundLevel1: string;
      backgroundLevel2: string;
      backgroundLevel3: string;
      backgroundLevel4: string;
      textPrimary: string;
      textSecondary: string;
      textTertiary: string;
      textReverse: string;
      textLink: string;
    };
  }
}
