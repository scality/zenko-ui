import { CommvaultLogo } from '../Logo/CommvaultLogo';
import KastenLogo from '../Logo/KastenLogo';
import { VEEAM_BACKUP_REPLICATION } from '../Veeam/VeeamConstants';
import HycuLogo from '../Logo/HycuLogo';
import CteraLogo from '../Logo/CteraLogo';
import RubrikLogo from '../Logo/RubrikLogo';
import VeeamLogo from '../Logo/VeeamLogo';
import SplunkLogo from '../Logo/SplunkLogo';
import ZertoLogo from '../Logo/ZertoLogo';
import VeritasLogo from '../Logo/VeritasLogo';
import CohesityLogo from '../Logo/CohesityLogo';
import React from 'react';

export type ISVConfig = {
  id: string;
  name: string;
  application?: string;
  documentationLink: string;
  logo: React.JSX.Element;
  type?: string;
  assistant?: boolean;
};

export const ISVList: ISVConfig[] = [
  {
    assistant: true,
    id: 'veeam',
    name: 'Veeam',
    logo: <VeeamLogo />,
    type: VEEAM_BACKUP_REPLICATION,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/veeam/index.html',
  },
  {
    assistant: true,
    id: 'veeam-vbo',
    name: 'Veeam VBO',
    logo: <VeeamLogo />,
    type: 'Veeam Backup for Microsoft 365',
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/veeam_backup_for_ms_365.html',
  },

  {
    assistant: true,
    id: 'commvault',
    name: 'Commvault',
    logo: <CommvaultLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/commvault.html',
  },
  {
    id: 'kasten',
    name: 'Kasten',
    application: 'Veeam Kasten',
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/kasten.html',
    logo: <KastenLogo />,
  },
  {
    id: 'rubrik',
    name: 'Rubrik',
    logo: <RubrikLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/rubrik_security_cloud.html',
  },
  {
    id: 'cohesity',
    name: 'Cohesity',
    logo: <CohesityLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/cohesity_cloud_archive.html',
  },
  {
    id: 'veritas',
    name: 'Veritas NetBackup',
    logo: <VeritasLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/veritas_netbackup.html',
  },
  {
    id: 'hycu',
    name: 'Hycu',
    logo: <HycuLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/hycu_enterprise-clouds.html',
  },
  {
    id: 'ctera',
    name: 'Ctera',
    logo: <CteraLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/ctera/index.html',
  },

  {
    id: 'splunk',
    name: 'Splunk',
    logo: <SplunkLogo />,
    //TODO update the link once the documentation is available
    documentationLink:
      'https://documentation-internal.scality.com/Artesca/3.1.0-dev/partner_applications/validated_designs/index.html',
  },
  {
    id: 'zerto',
    name: 'Zerto',
    logo: <ZertoLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/zerto/zerto.html',
  },
];

export type ISVConfigurationProps = {
  application: 'Veeam' | 'Commvault';
  bucketTag: 'Veeam' | 'Commvault';
  logo: React.JSX.Element;
  fieldOverrides: [
    {
      name: string;
      label?: string;
      tooltip?: React.JSX.Element;
      helpText?: string;
      placeholder?: string;
      additionnal?: React.JSX.Element[];
    },
  ];
};

// Future implementation type
export type FutureConfigurationProps = {
  // General isv name
  name: 'Veeam' | 'Commvault';
  // Application of the isv
  // An isv can have multiple applications
  application: string;
  bucketTag: 'Veeam' | 'Commvault';
  logo: Element;
  fieldOverrides: [
    {
      name: string;
      lable?: string;
      tooltip?: Element;
      helpText?: string;
      placeholder?: string;
      additionnal?: Element[];
    },
  ];
};
