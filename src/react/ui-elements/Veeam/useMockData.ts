import { useEffect, useState } from 'react';

type MockTableData = {
  action: string;
  status?: string;
};

const mockTableData = [
  {
    action: 'Create an Account',
    status: undefined,
  },
  {
    action: 'Create an User',
    status: undefined,
  },
  {
    action: 'Create a Bucket',
    status: undefined,
  },
  {
    action: 'Create the Veeam policy',
    status: undefined,
  },
  {
    action: 'Attach the Veeam policy to the User',
    status: undefined,
  },
  {
    action: 'Store Veeam use case',
    status: undefined,
  },
  {
    action: 'Enable Smart Object Storage support',
    status: undefined,
  },
  {
    action: 'See Smart Object Storage capacity',
    status: undefined,
  },
];

const status = ['success', 'error'];
export const useMockData = ({
  id,
  setId,
}: {
  id: number;
  setId: (id: number) => void;
}) => {
  const [data, setData] = useState<MockTableData[]>(mockTableData);
  const [isError, setIsError] = useState<boolean>(false);
  const randomIndex = Math.floor(Math.random() * status.length);

  const fetchMockData = async () => {
    const response = await Promise.resolve(
      status[randomIndex === 1 && isError ? 0 : randomIndex],
    );
    const newData = data.map((item) => {
      if (item.action === data[id].action) {
        return { ...item, status: response };
      }
      return item;
    });

    setData(newData);
    setId(response === 'error' ? 8 : id + 1);
  };

  useEffect(() => {
    if (id < 8) {
      setTimeout(() => {
        fetchMockData();
      }, 500);
    }
  }, [id]);

  useEffect(() => {
    if (randomIndex === 1) {
      setIsError(true);
    }
  }, [randomIndex]);

  return { data };
};
