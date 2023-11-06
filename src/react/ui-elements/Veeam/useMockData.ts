import { useEffect, useState } from 'react';

type MockTableData = {
  action: string;
  status?: string;
};

const mockTableData = [
  {
    step: 1,
    action: 'Create an Account',
    status: undefined,
  },
  {
    step: 2,
    action: 'Create an User',
    status: undefined,
  },
  { step: 3, action: 'Create a Bucket', status: undefined },
  {
    step: 4,
    action: 'Create the Veeam policy',
    status: undefined,
  },
  {
    step: 5,
    action: 'Attach the Veeam policy to the User',
    status: undefined,
  },
  {
    step: 6,
    action: 'Tag bucket as Veeam Bucket',
    status: undefined,
  },
  {
    step: 7,
    action: 'Enable Smart Object Storage support',
    status: undefined,
  },
  {
    step: 8,
    action: 'Set Smart Object Storage capacity',
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
