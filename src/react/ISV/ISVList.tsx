import { ISVCardConfig } from './types';
import { platformRegistry } from './platforms/registry';
import CohesityLogo from './components/Modal/Logos/CohesityLogo';
import CteraLogo from './components/Modal/Logos/CteraLogo';
import HycuLogo from './components/Modal/Logos/HycuLogo';
import RubrikLogo from './components/Modal/Logos/RubrikLogo';
import SplunkLogo from './components/Modal/Logos/SplunkLogo';
import VeritasLogo from './components/Modal/Logos/VeritasLogo';
import ZertoLogo from './components/Modal/Logos/ZertoLogo';
import { VeeamKastenLogo } from './components/Modal/Logos/VeeamKastenLogo';

export const ISVList: ISVCardConfig[] = [
  ...platformRegistry,
  {
    id: 'kasten',
    name: 'Kasten',
    documentationLink:
      '/artesca/docs/partner_applications/backup_and_archives/kasten.html',
    logo: <VeeamKastenLogo />,
  },
  {
    id: 'rubrik',
    name: 'Rubrik',
    logo: <RubrikLogo />,
    documentationLink:
      '/artesca/docs/partner_applications/backup_and_archives/rubrik_security_cloud.html',
  },
  {
    id: 'zerto',
    name: 'Zerto',
    logo: <ZertoLogo />,
    documentationLink:
      '/artesca/docs/partner_applications/backup_and_archives/zerto/zerto.html',
  },
  {
    id: 'splunk',
    name: 'Splunk',
    logo: <SplunkLogo />,
    documentationLink:
      '/artesca/docs/partner_applications/backup_and_archives/splunk.html',
  },
  {
    id: 'hycu',
    name: 'Hycu',
    logo: <HycuLogo />,
    documentationLink:
      '/artesca/docs/partner_applications/backup_and_archives/hycu_enterprise-clouds.html',
  },
  {
    id: 'ctera',
    name: 'Ctera',
    logo: <CteraLogo />,
    documentationLink:
      '/artesca/docs/partner_applications/cloud_and_edge_storage/ctera/index.html',
  },
  {
    id: 'veritas',
    name: 'Veritas NetBackup',
    logo: <VeritasLogo />,
    documentationLink:
      '/artesca/docs/partner_applications/backup_and_archives/veritas_netbackup.html',
  },
  {
    id: 'cohesity',
    name: 'Cohesity',
    logo: <CohesityLogo />,
    documentationLink:
      '/artesca/docs/partner_applications/backup_and_archives/cohesity_cloud_archive.html',
  },
];
