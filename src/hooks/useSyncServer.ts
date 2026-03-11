// src/hooks/useSyncServer.ts
import { useEffect, useRef } from 'react';
import type { Room } from '@colyseus/sdk';
import type { ClaimRoomState } from '@/colyseus/state';
import type { ClaimServerState } from '@/types/game';
import { useGameStore } from '@/state/useGameStore';

// Assuming you have your visual store set up for the 3D engine
// import { useVisualStore } from '@/state/useVisualStore';

export function useSyncServer(room: Room<ClaimRoomState> | null) {
    // 🌟 The Async Mutex / Queue System
    const isProcessingRef = useRef(false);
    const stateQueueRef = useRef<ClaimServerState[]>([]);

    useEffect(() => {
        if (!room) return;

        // Safety flag to prevent React StrictMode from attaching duplicate listeners
        let isAttached = true;

        // 1. The Gatekeeper (Receives raw data from Colyseus)
        const handleStateChange = (rawState: ClaimRoomState) => {
            if (!isAttached) return;

            // Strip Colyseus Proxies -> Pure standard JavaScript Object
            const cleanState = rawState.toJSON() as unknown as ClaimServerState;

            // Push to our Mutex Queue instead of applying instantly
            stateQueueRef.current.push(cleanState);

            // Trigger the processing loop
            processQueue();
        };

        // 2. The Processor (The Async Mutex Implementation)
        const processQueue = async () => {
            // Lock the mutex: If animations are running or queue is empty, abort.
            if (isProcessingRef.current || stateQueueRef.current.length === 0) return;

            isProcessingRef.current = true; // Engage lock

            while (stateQueueRef.current.length > 0) {
                const nextState = stateQueueRef.current.shift();
                if (!nextState) continue;

                // A. Instantly update the Logical Server Truth in Zustand
                // (The UI Lobby and generic React components use this)
                useGameStore.getState().syncServerState(nextState);

                // B. Await the Visual Store / 3D Predictive Engine
                // This ensures cards don't "teleport" if two state updates
                // arrive 50ms apart. It forces the visual engine to finish
                // calculating its trajectories before accepting the next reality.

                // await useVisualStore.getState().processNextServerFrame(nextState);
            }

            isProcessingRef.current = false; // Release lock
        };

        // 3. Attach the primary listener
        room.onStateChange(handleStateChange);

        // 4. Set the initial hydration flag so the UI knows it's safe to render
        room.onStateChange.once(() => {
            useGameStore.getState().setInitialSync(true);
        });

        // 5. Cleanup function for when the component unmounts or room drops
        return () => {
            isAttached = false;
            // Wiping the queue prevents stale animations from playing on reconnect
            stateQueueRef.current = [];
        };
    }, [room]);
}