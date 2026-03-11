import React from 'react';
import {Text, TextStyle, TextProps, Platform} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

/**
 * AppText Component
 * Provides unified typography based on the active Sandia theme.
 * * @param variant - 'primary' (bold/highlight) or 'secondary' (subdued)
 */
interface AppTextProps extends TextProps {
    variant?: 'primary' | 'secondary';
    children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
                                                    variant = 'primary',
                                                    style,
                                                    children,
                                                    ...props
                                                }) => {
    const theme = useTheme();

    // Map the variant to your palette.ts structure
    const textColor = variant === 'primary'
        ? theme.text.primary
        : theme.text.secondary;

    const baseStyle: TextStyle = {
        color: textColor,
        // Using a clean sans-serif base for the "Claim" aesthetic
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    };

    return (
        <Text
            style={[baseStyle, style]}
            {...props}
        >
            {children}
        </Text>
    );
};