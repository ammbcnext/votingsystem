"use client";

import { useEffect, useState, useRef } from "react";
import { loadFingerprint } from "@/lib/fingerprint";
import gsap from "gsap";
import noUiSlider from "nouislider";
import "nouislider/dist/nouislider.css";
import clsx from "clsx";

export default function VotePage() {
    const [loading, setLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState<boolean | null>(null);
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [selectedNumber, setSelectedNumber] = useState(50);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const sliderRef = useRef<HTMLDivElement>(null);
    const numberRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // 1. Init & Check Status
    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                const fp = await loadFingerprint();
                if (!mounted) return;
                setVisitorId(fp);

                const res = await fetch(`/api/vote/status?fp=${fp}`);
                if (res.ok) {
                    const data = await res.json();
                    setHasVoted(data.hasVoted);
                } else {
                    // If error, maybe allow voting? or block?
                    // Let's assume safe to prompt, backend will double check.
                    setHasVoted(false);
                }
            } catch (e) {
                console.error("Init error", e);
                if (mounted) setHasVoted(false);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        init();
        return () => {
            mounted = false;
        };
    }, []);

    // 2. Initialize Slider (only if hasVoted === false)
    useEffect(() => {
        if (loading || hasVoted || success || !sliderRef.current) return;

        // Destroy existing if any? React handles ref updates usually.
        if ((sliderRef.current as any).noUiSlider) return;

        const slider = noUiSlider.create(sliderRef.current, {
            start: 50,
            range: { min: 0, max: 100 },
            step: 1,
            connect: [true, false], // Fill left side
            tooltips: false,
        });

        slider.on("update", (values) => {
            const val = Math.round(Number(values[0]));
            setSelectedNumber(val);

            // Animation: Number "pop"
            if (numberRef.current) {
                gsap.fromTo(
                    numberRef.current,
                    { scale: 1.2, filter: "blur(2px)" },
                    { scale: 1, filter: "blur(0px)", duration: 0.2, ease: "back.out(1.7)" }
                );
            }
        });

        // Intro animation
        if (modalRef.current && overlayRef.current) {
            const tl = gsap.timeline();
            tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 })
                .fromTo(
                    modalRef.current,
                    { scale: 0.8, opacity: 0, y: 20 },
                    { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
                    "-=0.3"
                );
        }

        return () => {
            // cleanup slider?? noUiSlider destroy not straightforward in react sometimes
            // but strictly we can leave it
        };
    }, [loading, hasVoted, success]);

    // 3. Submit Vote
    const handleVote = async () => {
        if (!visitorId || submitting) return;
        setSubmitting(true);

        // Button animation
        // (Managed via CSS active state mostly, or gsap below)

        try {
            const res = await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ number: selectedNumber, fp: visitorId }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                // Success Animation
                if (modalRef.current) {
                    gsap.to(modalRef.current, { scale: 0.95, opacity: 0, duration: 0.3 });
                }
            } else if (res.status === 409) {
                setHasVoted(true); // Already voted
            } else {
                alert("Errore: " + (data.error || "Riprova"));
            }
        } catch (e) {
            console.error(e);
            alert("Errore di connessione");
        } finally {
            setSubmitting(false);
        }
    };

    // RENDER
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-pulse text-xl font-light tracking-widest">
                    WAITING...
                </div>
            </div>
        );
    }

    // ALREADY VOTED or SUCCESS
    if (hasVoted || success) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 animate-in fade-in zoom-in duration-700">
                    {success ? "VOTO REGISTRATO" : "HAI GIÀ VOTATO"}
                </h1>
                <p className="text-gray-400 text-lg">Grazie per la tua partecipazione.</p>
            </div>
        );
    }

    // VOTING UI
    return (
        <div className="min-h-screen bg-neutral-950 text-white overflow-hidden relative font-sans">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-black z-0" />

            {/* Overlay */}
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center p-4"
            >
                <div
                    ref={modalRef}
                    className="bg-neutral-900/90 border border-neutral-800 shadow-2xl rounded-3xl p-8 w-full max-w-md relative z-20 flex flex-col items-center gap-10"
                >
                    <div className="text-center space-y-2">
                        <h2 className="text-neutral-400 uppercase tracking-widest text-sm font-semibold">Il tuo voto</h2>
                        <div
                            ref={numberRef}
                            className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500 leading-none select-none"
                        >
                            {selectedNumber}
                        </div>
                    </div>

                    <div className="w-full px-2 py-4">
                        <div ref={sliderRef} id="slider" className="h-4" />
                        <div className="flex justify-between text-xs text-neutral-600 mt-4 font-mono">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>

                    <button
                        onClick={handleVote}
                        disabled={submitting}
                        className={clsx(
                            "w-full py-4 rounded-xl text-xl font-bold tracking-wide transition-all duration-200 active:scale-95 shadow-lg shadow-blue-900/20",
                            submitting ? "bg-neutral-800 text-neutral-500 cursor-wait" : "bg-white text-black hover:bg-neutral-200"
                        )}
                    >
                        {submitting ? "INVIO..." : "CONFERMA VOTO"}
                    </button>
                </div>
            </div>

            {/* Global CSS for noUiSlider overrides */}
            <style jsx global>{`
        .noUi-target {
            background: #262626;
            border: none;
            box-shadow: none;
            height: 12px;
            border-radius: 99px;
        }
        .noUi-connect {
            background: #ffffff;
        }
        .noUi-handle {
            width: 28px;
            height: 28px;
            right: -14px !important;
            top: -8px !important;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 0 20px rgba(255,255,255,0.5);
            border: none;
            cursor: grab;
        }
        .noUi-handle:before, .noUi-handle:after {
            display: none;
        }
        .noUi-handle:active {
            cursor: grabbing;
            transform: scale(1.1);
        }
      `}</style>
        </div>
    );
}
