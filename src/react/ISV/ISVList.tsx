import { VeeamVBOCardInfo } from './modules/veeam-vbo';
import { ISVCardConfig } from './types';
import CohesityLogo from './components/Modal/Logos/CohesityLogo';
import CteraLogo from './components/Modal/Logos/CteraLogo';
import HycuLogo from './components/Modal/Logos/HycuLogo';
import KastenLogo from './components/Modal/Logos/KastenLogo';
import RubrikLogo from './components/Modal/Logos/RubrikLogo';
import SplunkLogo from './components/Modal/Logos/SplunkLogo';
import VeritasLogo from './components/Modal/Logos/VeritasLogo';
import ZertoLogo from './components/Modal/Logos/ZertoLogo';
import { VeeamCardInfo } from './modules/veeam';
import { CommvaultCardInfo } from './modules/commvault';

export const ISVList: ISVCardConfig[] = [
  VeeamVBOCardInfo,
  VeeamCardInfo,
  CommvaultCardInfo,
  {
    id: 'kasten',
    name: 'Kasten',
    application: 'Veeam Kasten',
    documentationLink:
      '/docs/partner_applications/validated_designs/kasten.html',
    logo: <KastenLogo />,
  },
  {
    id: 'rubrik',
    name: 'Rubrik',
    logo: <RubrikLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/rubrik_security_cloud.html',
  },

  {
    id: 'zerto',
    name: 'Zerto',
    logo: <ZertoLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/zerto/zerto.html',
  },
  {
    id: 'splunk',
    name: 'Splunk',
    logo: <SplunkLogo />,

    documentationLink:
      '/docs/partner_applications/validated_designs/splunk.html',
  },
  {
    id: 'hycu',
    name: 'Hycu',
    logo: <HycuLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/hycu_enterprise-clouds.html',
  },
  {
    id: 'ctera',
    name: 'Ctera',
    logo: <CteraLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/ctera/index.html',
  },

  {
    id: 'veritas',
    name: 'Veritas NetBackup',
    logo: <VeritasLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/veritas_netbackup.html',
  },

  {
    id: 'cohesity',
    name: 'Cohesity',
    logo: <CohesityLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/cohesity_cloud_archive.html',
  },
];
