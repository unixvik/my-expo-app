// src/components/Buttons/animations.ts

export const discardButtonAnimations = {
    // The main container entrance/exit (The "Materialize" effect)
    container: {
        initial: { opacity: 0, y: 40, filter: "blur(12px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: 20, scale: 0.9, filter: "blur(12px)" },
        transition: {
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 1,
        },
    },
    // The sheen effect that sweeps across the button
    sheen: {
        variants: {
            idle: { x: "-150%" },
            hover: { x: "150%" },
        },
        transition: { duration: 0.6, ease: "easeInOut" },
    },
    // Button interactions (hover/tap)
    button: {
        whileHover: "hover",
        whileTap: { scale: 0.92 },
        initial: "idle",
    },
};