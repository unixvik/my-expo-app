import { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { createStyles } from "@/components/Screens/GameBoard.styles";

export const useAppStyles = () => {
    const theme = useTheme();
    const { scale, moderateScale, isLandscape } = useResponsive();

    const styles = useMemo(
        () => createStyles(theme, scale, moderateScale, isLandscape),
        [theme, scale, moderateScale, isLandscape]
    );

    return {
        styles,
        theme,
        scale,
        moderateScale,
        isLandscape
    };
};
