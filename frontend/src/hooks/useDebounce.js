// This code is used for the useDebounce hook: returns `value` only after it has stopped changing for `delay` ms.
// Used by the search box so we call the API once when the user pauses typing, not on every keystroke.
import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 400) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer); // typing again cancels the previous timer
    }, [value, delay]);

    return debounced;
};

export default useDebounce;
