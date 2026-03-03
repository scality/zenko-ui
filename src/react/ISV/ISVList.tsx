import CohesityLogo from './components/Modal/Logos/CohesityLogo';
import CteraLogo from './components/Modal/Logos/CteraLogo';
import HycuLogo from './components/Modal/Logos/HycuLogo';
import RubrikLogo from './components/Modal/Logos/RubrikLogo';
import SplunkLogo from './components/Modal/Logos/SplunkLogo';
import VeritasLogo from './components/Modal/Logos/VeritasLogo';
import ZertoLogo from './components/Modal/Logos/ZertoLogo';
import { platformRegistry } from './platforms/registry';
import type { ISVCardConfig } from './types';

export const ISVList: ISVCardConfig[] = [
  ...platformRegistry,
  {
    id: 'rubrik',
    name: 'Rubrik',
    logo: <RubrikLogo />,
    documentationLink: '/artesca/docs/partner_applications/backup_and_archives/rubrik_security_cloud.html',
    category: 'backup-and-archive',
  },
  {
    id: 'zerto',
    name: 'Zerto',
    logo: <ZertoLogo />,
    documentationLink: '/artesca/docs/partner_applications/backup_and_archives/zerto.html',
    category: 'backup-and-archive',
  },
  {
    id: 'splunk',
    name: 'Splunk',
    logo: <SplunkLogo />,
    documentationLink: '/artesca/docs/partner_applications/big_data_storage/splunk.html',
    category: 'big-data-storage',
  },
  {
    id: 'hycu',
    name: 'Hycu',
    logo: <HycuLogo />,
    documentationLink: '/artesca/docs/partner_applications/backup_and_archives/hycu_enterprise-clouds.html',
    category: 'backup-and-archive',
  },
  {
    id: 'ctera',
    name: 'Ctera',
    logo: <CteraLogo />,
    documentationLink: '/artesca/docs/partner_applications/cloud_and_edge_storage/ctera/index.html',
    category: 'cloud-and-edge-storage',
  },
  {
    id: 'veritas',
    name: 'Veritas NetBackup',
    logo: <VeritasLogo />,
    documentationLink: '/artesca/docs/partner_applications/backup_and_archives/veritas_netbackup.html',
    category: 'backup-and-archive',
  },
  {
    id: 'cohesity',
    name: 'Cohesity',
    logo: <CohesityLogo />,
    documentationLink: '/artesca/docs/partner_applications/backup_and_archives/cohesity_cloud_archive.html',
    category: 'backup-and-archive',
  },
];
