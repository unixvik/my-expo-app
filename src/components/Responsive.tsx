// components/Responsive.tsx
import { useDevice } from '@/hooks/useDevice';

interface Props {
    mobile: React.ReactNode;
    desktop: React.ReactNode;
}

export function Responsive({ mobile, desktop }: Props) {
    const { isDesktop } = useDevice();
    return <>{isDesktop ? desktop : mobile}</>;
}