'use client';

import { motion } from 'framer-motion';

const threats = [
  {
    time: '14:32:08',
    group: 'CS-301 Study Group',
    preview: 'Join our forex trading group! Free signals daily, guaranteed 90% win rate...',
    rule: 'forex keyword',
    ruleColor: '#ffb95f',
    icon: 'trending_up',
  },
  {
    time: '14:28:41',
    group: 'Uni Frankfurt WG',
    preview: '\uD83D\uDCDA\uD835\uDDD4\uD835\uDE00\uD835\uDE00\uD835\uDDFA\uD835\uDDF4\uD835\uDDFB\uD835\uDDFA\uD835\uDDF2\uD835\uDDFB\uD835\uDE01\uD835\uDE00 \uD835\uDDDB\uD835\uDDF2\uD835\uDDF9\uD835\uDDFD 30% discount wa.me/44...',
    rule: 'thesis writing + promo',
    ruleColor: '#60a5fa',
    icon: 'school',
  },
  {
    time: '13:55:19',
    group: 'Semester 4 Chat',
    preview: 'Try your luck at bet365.com! Sign-up bonus 200% on your first deposit...',
    rule: 'known spam domain',
    ruleColor: '#ff6b6b',
    icon: 'block',
  },
  {
    time: '13:41:03',
    group: 'Math Tutoring',
    preview: 'Hot singles in your area are waiting! Click here to meet them now...',
    rule: 'adult keyword',
    ruleColor: '#ff6b6b',
    icon: 'block',
  },
  {
    time: '12:17:55',
    group: 'CS-201 Algorithms',
    preview: 'Claim your free crypto airdrop at bit.ly/3xK... Limited time only, act now!',
    rule: 'AI classified (Gemini)',
    ruleColor: '#c084fc',
    icon: 'psychology',
  },
];

export default function StatsShowcase() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-2xl">radar</span>
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            Recent Threat Intelligence
          </h2>
        </div>
        <p className="text-on-surface-variant text-sm max-w-md mx-auto">
          Example intercepted threats showing real-time detection across multiple university groups.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3 max-w-3xl mx-auto">
        {threats.map((threat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-surface-container-low rounded-xl px-5 py-4 flex items-start gap-4"
            style={{ boxShadow: '0 0 0 1px rgba(78,222,163,0.08)' }}
          >
            {/* Icon */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
              style={{ background: `${threat.ruleColor}15` }}
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ color: threat.ruleColor }}
              >
                {threat.icon}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="font-data text-[11px] text-on-surface-variant">{threat.time}</span>
                <span className="text-xs text-on-surface-variant/60">{threat.group}</span>
              </div>
              <p className="text-on-surface text-sm leading-relaxed truncate">{threat.preview}</p>
            </div>

            {/* Rule + Status */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-data font-medium"
                style={{
                  background: `${threat.ruleColor}15`,
                  color: threat.ruleColor,
                  border: `1px solid ${threat.ruleColor}30`,
                }}
              >
                {threat.rule}
              </span>
              <span className="inline-flex items-center gap-1 text-danger text-[10px] font-semibold">
                <span className="material-symbols-outlined text-xs">person_remove</span>
                Kicked
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
