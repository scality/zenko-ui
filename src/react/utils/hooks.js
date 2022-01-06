import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { addTrailingSlash } from '.';

export const useHeight = myRef => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setHeight(myRef.current.offsetHeight);
    };

    if (myRef.current) {
      setHeight(myRef.current.offsetHeight);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [myRef]);

  return height;
};

export const useOutsideClick = (ref, actionFn) => {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        actionFn();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, actionFn]);
};

export const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

export const usePrefixWithSlash = () => {
  const query = useQuery();
  const prefix = query.get('prefix');

  if (!prefix) {
    return '';
  }
  // If the prefix includes both folder and object, we have to remove the last part of the path which is the object key
  if (prefix && prefix.slice(-1) !== '/') {
    const prefixArr = prefix.split('/');
    prefixArr.pop();
    if (!prefixArr.length) {
      return '';
    }
    return addTrailingSlash(prefixArr.join('/'));
  } else {
    return prefix;
  }
};
