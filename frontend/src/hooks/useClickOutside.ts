import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement>(
    handler: () => void,
    isActive: boolean = true
) {
    const ref = useRef<T>(null);

    useEffect(() => {
        if (!isActive) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler();
            }
        };

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handler, isActive]);

    return ref;
}