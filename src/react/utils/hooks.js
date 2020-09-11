import { useEffect, useState } from 'react';

export const useHeight = (myRef) => {
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
