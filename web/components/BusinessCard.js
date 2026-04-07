'use client';

import { useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';

export default function BusinessCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 30, mass: 0.3 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], ['20deg', '-20deg']);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], ['-20deg', '20deg']);

  // Shadow moves opposite to tilt
  const shadowX = useTransform(smoothX, [-0.5, 0.5], [12, -12]);
  const shadowY = useTransform(smoothY, [-0.5, 0.5], [12, -12]);
  const shadow = useMotionTemplate`${shadowX}px ${shadowY}px 40px rgba(0,0,0,0.35)`;

  // Holographic highlight position
  const highlightX = useTransform(smoothX, [-0.5, 0.5], ['0%', '100%']);
  const highlightY = useTransform(smoothY, [-0.5, 0.5], ['0%', '100%']);
  const highlightBg = useMotionTemplate`radial-gradient(circle at ${highlightX} ${highlightY}, rgba(78,222,163,0.12) 0%, transparent 60%)`;

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }

  return (
    <div style={{ perspective: '1200px' }} className="w-full max-w-sm mx-auto">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          boxShadow: shadow,
          willChange: isHovered ? 'transform' : 'auto',
        }}
        animate={{ y: isHovered ? -8 : 0 }}
        transition={{ duration: 0.3 }}
        className="relative cursor-pointer select-none"
      >
        {/* Front */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div
            className="relative bg-surface-container-low p-6 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 0 1px rgba(78,222,163,0.15)' }}
          >
            {/* Glow blobs */}
            <div
              className="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-500"
              style={{
                background: '#4edea3',
                filter: 'blur(60px)',
                opacity: isHovered ? 0.25 : 0.1,
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-24 h-24 rounded-full pointer-events-none transition-opacity duration-500"
              style={{
                background: '#ffb95f',
                filter: 'blur(60px)',
                opacity: isHovered ? 0.2 : 0.08,
              }}
            />

            {/* Holographic overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ background: highlightBg }}
            />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">shield</span>
                <span className="font-headline font-bold text-on-surface text-base">
                  Sentinel Protocol
                </span>
              </div>

              <p className="text-on-surface-variant text-sm mb-6">WhatsApp Spam Guard</p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Built by Alperen Adatepe</span>
                <a
                  href="https://github.com/noluyorAbi/whatsapp-spam-guard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  GitHub &rarr;
                </a>
              </div>
            </div>

            {/* Flip hint */}
            <div className="absolute bottom-2 right-3 flex items-center gap-1 text-on-surface-variant/40 text-[10px]">
              <span className="material-symbols-outlined text-xs">360</span>
              Click to flip
            </div>
          </div>
        </motion.div>

        {/* Back */}
        <motion.div
          animate={{ rotateY: isFlipped ? 0 : -180 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
            position: 'absolute',
            inset: 0,
          }}
          className="rounded-2xl overflow-hidden"
        >
          <div
            className="relative bg-surface-container-low p-6 rounded-2xl h-full flex flex-col items-center justify-center overflow-hidden"
            style={{ boxShadow: '0 0 0 1px rgba(78,222,163,0.15)' }}
          >
            {/* Glow blobs */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: '#4edea3', filter: 'blur(60px)', opacity: 0.12 }}
            />
            <div
              className="absolute bottom-0 left-0 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: '#ffb95f', filter: 'blur(60px)', opacity: 0.08 }}
            />

            {/* Holographic overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ background: highlightBg }}
            />

            {/* QR-like pattern */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="grid grid-cols-5 gap-1 mb-2">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      background:
                        [0,1,2,4,5,9,10,14,15,19,20,22,23,24].includes(i)
                          ? '#4edea3'
                          : 'rgba(78,222,163,0.15)',
                    }}
                  />
                ))}
              </div>
              <p className="text-on-surface-variant text-xs text-center">Scan to report spam</p>
              <p className="font-data text-primary text-[10px] tracking-wide">
                whatsapp-spam-guard.vercel.app
              </p>

              <div className="mt-3 flex items-center gap-4 text-on-surface-variant text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">speed</span>
                  &lt;200ms
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">psychology</span>
                  AI + Rules
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">lock</span>
                  E2E
                </span>
              </div>
            </div>

            {/* Flip hint */}
            <div className="absolute bottom-2 right-3 flex items-center gap-1 text-on-surface-variant/40 text-[10px]">
              <span className="material-symbols-outlined text-xs">360</span>
              Click to flip
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
