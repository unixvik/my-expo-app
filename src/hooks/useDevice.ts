import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

function getDevice() {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;

    // Native platforms are always "mobile" regardless of width
    const isMobile = Platform.OS !== 'web' || width < 1024;

    return {
        isMobile,
        isLandscape,
        isMobileLandscape:  isMobile && isLandscape,
        isMobilePortrait:   isMobile && !isLandscape,
        isDesktop:          !isMobile,
        isNative:           Platform.OS !== 'web',   // bonus: skip resize listener on native
        platform:           Platform.OS,
    };
}

export function useDevice() {
    const [device, setDevice] = useState(getDevice);

    useEffect(() => {
        // On native, orientation changes fire Dimensions events too,
        // but a resize listener on web is redundant — only subscribe when needed
        if (Platform.OS !== 'web') {
            const sub = Dimensions.addEventListener('change', () => setDevice(getDevice()));
            return () => sub?.remove();
        }

        // Web: matchMedia is more reliable than Dimensions polling
        const mq = window.matchMedia('(min-width: 1024px)');
        const handler = () => setDevice(getDevice());
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return device;
}