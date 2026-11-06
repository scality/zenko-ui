import CohesityLogo from './components/Modal/Logos/CohesityLogo';
import CteraLogo from './components/Modal/Logos/CteraLogo';
import HycuLogo from './components/Modal/Logos/HycuLogo';
import SplunkLogo from './components/Modal/Logos/SplunkLogo';
import ZertoLogo from './components/Modal/Logos/ZertoLogo';
import { platformRegistry } from './platforms/registry';
import type { ISVCardConfig } from './types';

export const ISVList: ISVCardConfig[] = [
  ...platformRegistry,
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
    name: 'Cohesity NetBackup',
    logo: <CohesityLogo />,
    application: 'Cohesity NetBackup',
    documentationLink: '/artesca/docs/partner_applications/backup_and_archives/cohesity_netbackup.html',
    category: 'backup-and-archive',
  },
  {
    id: 'cohesity',
    name: 'Cohesity CloudArchive',
    logo: <CohesityLogo />,
    application: 'Cohesity CloudArchive',
    documentationLink: '/artesca/docs/partner_applications/backup_and_archives/cohesity_cloud_archive.html',
    category: 'backup-and-archive',
  },
  {
    id: 'apache-airflow',
    name: 'Apache Airflow',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/apache_airflow.html',
    category: 'ai-solutions',
  },
  {
    id: 'apache-arrow',
    name: 'Apache Arrow',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/apache_arrow.html',
    category: 'ai-solutions',
  },
  {
    id: 'apache-nifi',
    name: 'Apache NiFi',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/apache_nifi.html',
    category: 'ai-solutions',
  },
  {
    id: 'apache-spark',
    name: 'Apache Spark',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/apache_spark.html',
    category: 'ai-solutions',
  },
  {
    id: 'bodo',
    name: 'Bodo.ai',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/bodo.html',
    category: 'ai-solutions',
  },
  {
    id: 'dvc',
    name: 'Data Version Control',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/dvc.html',
    category: 'ai-solutions',
  },
  {
    id: 'jax',
    name: 'Jax',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/jax.html',
    category: 'ai-solutions',
  },
  {
    id: 'kubeflow',
    name: 'Kubeflow',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/kubeflow.html',
    category: 'ai-solutions',
  },
  {
    id: 'lakefs',
    name: 'LakeFS',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/lakefs.html',
    category: 'ai-solutions',
  },
  {
    id: 'metaflow',
    name: 'Metaflow',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/metaflow.html',
    category: 'ai-solutions',
  },
  {
    id: 'mlflow',
    name: 'MLflow',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/mlflow.html',
    category: 'ai-solutions',
  },
  {
    id: 'pachyderm',
    name: 'Pachyderm',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/pachyderm.html',
    category: 'ai-solutions',
  },
  {
    id: 'pytorch',
    name: 'PyTorch',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/pytorch.html',
    category: 'ai-solutions',
  },
  {
    id: 'ray',
    name: 'Ray',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/ray.html',
    category: 'ai-solutions',
  },
  {
    id: 'snorkel-ai',
    name: 'Snorkel AI',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/snorkel_ai.html',
    category: 'ai-solutions',
  },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/tensor_flow.html',
    category: 'ai-solutions',
  },
  {
    id: 'weaviate',
    name: 'Weaviate',
    documentationLink: '/artesca/docs/partner_applications/ai_solutions/weaviate.html',
    category: 'ai-solutions',
  },
];
