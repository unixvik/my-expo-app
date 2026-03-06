// Add this particle system component (create new file: CardParticles.tsx)
import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    hue: number;
    alpha: number;
}

export const CardParticleSystem = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particlesRef.current = particlesRef.current.filter(p => {
                p.life--;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15; // Gravity
                p.alpha = p.life / p.maxLife;

                if (p.life <= 0) return false;

                // Draw particle with glow
                ctx.save();
                ctx.globalAlpha = p.alpha;

                // Outer glow
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, 0.8)`);
                gradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);

                // Core particle
                ctx.fillStyle = `hsl(${p.hue}, 100%, 90%)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                return true;
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Expose function to create particles
        (window as any).createCardParticles = (x: number, y: number, count: number = 15) => {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
                const speed = 2 + Math.random() * 4;
                particlesRef.current.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    life: 40 + Math.random() * 20,
                    maxLife: 60,
                    size: 1.5 + Math.random() * 2,
                    hue: 180 + Math.random() * 60, // Blue-cyan range
                    alpha: 1,
                });
            }
        };

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(rafRef.current);
            delete (window as any).createCardParticles;
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 9999,
            }}
        />
    );
};