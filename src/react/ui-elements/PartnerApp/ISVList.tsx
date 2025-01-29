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

export const ISVList = [
  {
    id: 'veeam',

    name: 'Veeam',
    logo: <VeeamLogo />,
    type: VEEAM_BACKUP_REPLICATION,
  },
  // {
  //   name: 'Veeam VBO',
  //   logo: <VeeamLogo />,
  //   type: 'Veeam Backup for Microsoft 365',
  // },

  { id: 'commvault', name: 'Commvault', logo: <CommvaultLogo /> },
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
type ISVManual = {
  name: string;
  application?: string;
  documentationLink: string;
  logo: React.JSX.Element;
};

export const ISVManualList: ISVManual[] = [
  {
    name: 'Kasten',
    application: 'Veeam Kasten',
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.1/partner_applications/validated_designs/kasten.html',
    logo: <KastenLogo />,
  },
  {
    name: 'Hycu',
    logo: <HycuLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.1/partner_applications/validated_designs/hycu_enterprise-clouds.html',
  },
  {
    name: 'Ctera',
    logo: <CteraLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.1/partner_applications/validated_designs/ctera/index.html',
  },
  {
    name: 'Rubrik',
    logo: <RubrikLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.1/partner_applications/validated_designs/rubrik_security_cloud.html',
  },
  {
    name: 'Splunk',
    logo: <SplunkLogo />,
    //TODO update the link once the documentation is available
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/index.html',
  },
  {
    name: 'Cohesity',
    logo: <CohesityLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/cohesity_cloud_archive.html',
  },
  {
    name: 'Veritas',
    logo: <VeritasLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/veritas_netbackup.html',
  },
  {
    name: 'Zerto',
    logo: <ZertoLogo />,
    documentationLink:
      'https://documentation.scality.com/Artesca/3.0.2/partner_applications/validated_designs/zerto/zerto.html',
  },
];

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
