// This code is used for the useSeatUpdates hook: calls `onUpdate({eventId, registeredCount, capacity})`
// whenever the server announces that somebody registered / cancelled - so seat counts update live without refreshing.
import { useEffect, useRef } from 'react';
import { socket } from '../socket';

const useSeatUpdates = (onUpdate) => {
    const handlerRef = useRef(onUpdate);

    // Keep the ref pointing at the latest callback (done in an effect, not during render)
    useEffect(() => {
        handlerRef.current = onUpdate;
    });

    // Subscribe once; unsubscribe on unmount
    useEffect(() => {
        const listener = (payload) => handlerRef.current(payload);
        socket.on('seats:update', listener);
        return () => socket.off('seats:update', listener);
    }, []);
};

export default useSeatUpdates;
