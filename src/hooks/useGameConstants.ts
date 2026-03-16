import {useSelf} from "@/state/gameSelectors";
import {useMemo} from "react";
import {useGameStore} from "@/state/useGameStore";

export const useGameConstants = () => {
    const me = useSelf();
    const currentRound = useGameStore((s) => s.server.round);
    const claimRoundOpen = useGameStore((s) => s.server.claimRoundOpen);
    const isClaimOpen = useMemo(() => {
        return currentRound >= claimRoundOpen;
    }, [currentRound,claimRoundOpen]);

    return {
        isClaimOpen,
    }

}