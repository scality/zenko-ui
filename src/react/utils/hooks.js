import { useState } from 'react';

export const useInput = (initialValue, validate) => {
    const [value, setValue] = useState(initialValue);
    const [errorMessage, setErrorMessage] = useState();
    const [hasError, setHasError] = useState();
    return {
        value,
        setValue,
        reset: () => setValue(initialValue),
        onChange: event => {
            setErrorMessage('');
            setHasError(false);
            setValue(event.target.value);
        },
        validation: (value) => {
            const error = validate(value);
            setErrorMessage(error.message);
            setHasError(error.hasError);
            return !error.hasError;
        },
        setHasError,
        hasError,
        errorMessage,
        setErrorMessage,
    };
};
