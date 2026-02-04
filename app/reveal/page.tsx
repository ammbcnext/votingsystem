"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Fireworks } from "fireworks-js";
import clsx from "clsx";

gsap.registerPlugin(Flip);

// Types
type VoteData = number; // raw numbers
type ResultsData = {
    counts: Record<string, number>;
    top3: { number: number; count: number }[];
    totalVotes: number;
};

export default function RevealPage() {
    const [started, setStarted] = useState(false);
    const [votes, setVotes] = useState<VoteData[]>([]);
    const [results, setResults] = useState<ResultsData | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const bubbleLayerRef = useRef<HTMLDivElement>(null);
    const podiumLayerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fireworksInstance = useRef<Fireworks | null>(null);

    // 1. Fetch Data
    useEffect(() => {
        async function fetchData() {
            // Get raw votes for bubbles
            const vRes = await fetch("/api/votes");
            const vData = await vRes.json();
            setVotes(vData.votes || []);

            // Get aggregated results for podium
            const rRes = await fetch("/api/results");
            const rData = await rRes.json();
            setResults(rData);
        }
        fetchData();
    }, []);

    // 2. Main Animation Sequence
    const startReveal = async () => {
        setStarted(true);
        if (!bubbleLayerRef.current) return;

        const timeline = gsap.timeline();

        // FASE A: SPAWN & FLOAT
        // We create elements dynamically or select them if rendered.
        // Let's rely on React rendering the bubbles first? 
        // Actually, waiting for React render might be tricky with Flip state.
        // Better strategy: Render all bubbles hidden, then animate in.

        // Allow a tick for React to render the bubbles
        await new Promise((r) => setTimeout(r, 100));

        const bubbles = gsap.utils.toArray(".vote-bubble") as HTMLElement[];

        // Shuffle bubbles for random spawn order? Or usage as is.
        // Let's shuffle indices.
        const indices = bubbles.map((_, i) => i).sort(() => Math.random() - 0.5);

        // Spawn Animation
        indices.forEach((idx, i) => {
            const bubble = bubbles[idx];
            // Random position within viewport
            // We set specific random positions initially via CSS or GSAP set
            // Actually we'll let them settle in the "cloud" first.

            const x = Math.random() * (window.innerWidth - 100) + 50;
            const y = Math.random() * (window.innerHeight - 100) + 50;

            gsap.set(bubble, { x, y, scale: 0, opacity: 0 });

            timeline.to(bubble, {
                scale: 1,
                opacity: 1,
                duration: 0.4,
                ease: "back.out(1.5)",
            }, i * 0.1); // Stagger 0.1s

            // Add floating effect individually
            // Note: float needs to be separate from the timeline eventually or additive
            gsap.to(bubble, {
                x: `+=${Math.random() * 60 - 30}`,
                y: `+=${Math.random() * 60 - 30}`,
                duration: 3 + Math.random() * 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });

        // Wait for all to spawn
        const spawnDuration = bubbles.length * 0.1 + 1;
        timeline.addLabel("spawned", `+=${0.5}`);

        // FASE B: MERGE (Stack by number)
        timeline.call(() => {
            // Prepare Flip State
            const state = Flip.getState(bubbles);

            // We need to move bubbles into "groups".
            // In React, we'd change state to group them, but that triggers re-render and might lose DOM ref continuity if key changes.
            // Better: Reparenting via DOM is what Flip handles well, but in React it's risky.
            // Alternative: Just animate X/Y to a grid layout WITHOUT reparenting.

            // Calculate grid positions for each number.
            // Organizing by number.
            // We know the counts from results.

            if (!results) return;

            // Define grid centers for each number (roughly)
            // Or just a packed circle layout?
            // Let's do a simple grid of clusters.

            // Map number -> target center {x, y}
            // This is complex to calculate dynamically. 
            // SIMPLIFIED MERGE: Move all bubbles of same number to a single spot (stack).

            const uniqueNumbers = Object.keys(results.counts).map(Number);
            const cols = Math.ceil(Math.sqrt(uniqueNumbers.length));
            const spacingX = window.innerWidth / (cols + 1);
            const spacingY = window.innerHeight / (cols + 1);

            bubbles.forEach((b) => {
                const num = parseInt(b.getAttribute("data-number") || "0");
                const numIndex = uniqueNumbers.indexOf(num);

                // Grid Pos
                const row = Math.floor(numIndex / cols);
                const col = numIndex % cols;

                const targetX = (col + 1) * spacingX;
                const targetY = (row + 1) * spacingY;

                // Add some random offset for "stack" feel
                const offsetX = (Math.random() - 0.5) * 10;
                const offsetY = (Math.random() - 0.5) * 10;

                // Animate to new position
                gsap.to(b, {
                    x: targetX + offsetX,
                    y: targetY + offsetY,
                    duration: 1.5,
                    ease: "power3.inOut",
                    overwrite: "auto" // stop floating
                });
            });
        }, null, "+=1"); // delay after spawn

        // FASE C: PODIUM
        // Wait for merge
        timeline.addPause("+=2.5", () => {
            // Trigger Podium Phase
            animatePodium();
            timeline.resume();
        });
    };

    const animatePodium = () => {
        if (!results) return;
        const { top3 } = results;

        const bubbles = gsap.utils.toArray(".vote-bubble") as HTMLElement[];

        // Top 3 numbers
        const winners = top3.map(t => t.number);

        // Positions for 1st, 2nd, 3rd
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const positions = [
            { x: cx, y: cy - 100, scale: 2, label: "1st" }, // Gold
            { x: cx - 250, y: cy + 50, scale: 1.5, label: "2nd" }, // Silver
            { x: cx + 250, y: cy + 50, scale: 1.5, label: "3rd" }, // Bronze
        ];

        // For every bubble
        bubbles.forEach(b => {
            const num = parseInt(b.getAttribute("data-number") || "0");
            const rankIndex = winners.indexOf(num);

            if (rankIndex !== -1) {
                // It's a winner
                const pos = positions[rankIndex];

                gsap.to(b, {
                    x: pos.x + (Math.random() * 40 - 20),
                    y: pos.y + (Math.random() * 40 - 20),
                    scale: pos.scale, // Scale up!
                    zIndex: 100 - rankIndex,
                    duration: 2,
                    ease: "elastic.out(1, 0.5)",
                    delay: rankIndex * 0.2 // 1st last? or first? usually 2, 3 then 1. 2=silver, 3=bronze.
                    // Index 0 is Gold. Let's make Gold appear last for drama?
                    // No, simultaneous is fine.
                });

                // Glow effect
                gsap.to(b, { boxShadow: "0 0 30px rgba(255,215,0, 0.8)", repeat: -1, yoyo: true, duration: 1 });
            } else {
                // Loser fade out
                gsap.to(b, { opacity: 0, scale: 0, duration: 1 });
            }
        });

        // FASE D: Fireworks
        setTimeout(() => {
            startFireworks();
        }, 1500);
    };

    const startFireworks = () => {
        if (canvasRef.current && !fireworksInstance.current) {
            const fw = new Fireworks(canvasRef.current, {
                autoresize: true,
                opacity: 0.5,
                acceleration: 1.05,
                friction: 0.97,
                gravity: 1.5,
                particles: 50,
                traceLength: 3,
                traceSpeed: 10,
                explosion: 5,
                intensity: 30,
                flickering: 50,
                lineStyle: 'round',
                hue: { min: 0, max: 360 },
                delay: { min: 30, max: 60 },
                rocketsPoint: { min: 50, max: 50 },
                lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } },
                brightness: { min: 50, max: 80 },
                decay: { min: 0.015, max: 0.03 },
                mouse: { click: false, move: false, max: 1 }
            });
            fw.start();
            fireworksInstance.current = fw;

            // Text reveal
            gsap.fromTo("#winner-text", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1, ease: "back.out(2)" });
        }
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Canvas for Fireworks */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none fw" />

            {/* Start Overlay */}
            {!started && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <button
                        onClick={startReveal}
                        className="px-12 py-6 bg-white text-black text-3xl font-bold rounded-full hover:scale-105 transition active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.5)]"
                    >
                        AVVIA PREMIAZIONE
                    </button>
                </div>
            )}

            {/* Winner Text */}
            <div id="winner-text" className="absolute top-10 left-0 right-0 text-center opacity-0 z-40 pointer-events-none">
                <h1 className="text-6xl md:text-8xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
                    VINCITORI!
                </h1>
            </div>

            {/* Bubble Layer */}
            <div ref={bubbleLayerRef} className="absolute inset-0 z-10 pointer-events-none">
                {votes.map((num, i) => (
                    <div
                        key={i}
                        className="vote-bubble absolute w-16 h-16 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 border border-neutral-600 flex items-center justify-center text-xl font-bold shadow-lg opacity-0"
                        data-number={num}
                        style={{ willChange: "transform, opacity" }}
                    >
                        {num}
                    </div>
                ))}
            </div>

            {/* Podium Layer (Optional if using bubbles directly) */}
            <div ref={podiumLayerRef} className="absolute inset-0 z-20 pointer-events-none">
                {/* Can add pure CSS podium stands here if desired */}
            </div>
        </div>
    );
}
