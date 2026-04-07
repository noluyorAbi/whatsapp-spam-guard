'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const categories = [
  {
    name: 'Trading & Crypto',
    icon: 'trending_up',
    accent: '#ffb95f',
    domains: [
      'binance.com', 'bybit.com', 'okx.com', 'kucoin.com', 'mexc.com',
      'etoro.com', 'bitget.com', 'gate.io', 'huobi.com', 'kraken.com',
      'coinbase.com', 'crypto.com', 'bingx.com',
    ],
    keywords: [
      'forex', 'trading signals', 'crypto signals', 'binary options',
      'passive income', 'financial freedom', 'investment opportunity',
      'guaranteed profit', 'copy trading',
    ],
  },
  {
    name: 'Adult & Gambling',
    icon: 'block',
    accent: '#ff6b6b',
    domains: [
      'onlyfans.com', 'pornhub.com', 'chaturbate.com', 'fansly.com',
      'bet365.com', '1xbet.com', 'betway.com', 'stake.com',
      'unibet.com', 'draftkings.com',
    ],
    keywords: [
      'hot singles', 'nudes', 'escort', 'adult content', 'erotic',
      'betting tips', 'free bets', 'jackpot', 'casino bonus', 'guaranteed wins',
    ],
  },
  {
    name: 'Academic Fraud',
    icon: 'school',
    accent: '#60a5fa',
    keywords: [
      'grade guaranteer', 'get 80+ grade', 'academic writing service',
      'zero plagiarism', 'money back guarantee', 'guaranteed grade',
    ],
    contextKeywords: [
      'assignment help', 'thesis writing', 'essay writing',
      'dissertation writing', 'homework help',
    ],
  },
];

function CategoryCard({ category, index }) {
  const [expanded, setExpanded] = useState(false);

  const domainCount = category.domains?.length || 0;
  const keywordCount = category.keywords?.length || 0;
  const contextCount = category.contextKeywords?.length || 0;
  const allItems = [
    ...(category.domains || []).map((d) => ({ label: d, type: 'domain' })),
    ...category.keywords.map((k) => ({ label: k, type: 'keyword' })),
    ...(category.contextKeywords || []).map((k) => ({ label: k, type: 'context' })),
  ];
  const visibleItems = expanded ? allItems : allItems.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="bg-surface-container-low rounded-2xl p-6 flex flex-col"
      style={{ boxShadow: `0 0 0 1px ${category.accent}22` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="material-symbols-outlined text-lg"
          style={{ color: category.accent }}
        >
          {category.icon}
        </span>
        <h3 className="font-headline font-semibold text-on-surface text-sm">
          {category.name}
        </h3>
      </div>

      <p className="text-on-surface-variant text-xs mb-4 font-data">
        {domainCount > 0 && `${domainCount} domains`}
        {domainCount > 0 && keywordCount > 0 && ', '}
        {keywordCount > 0 && `${keywordCount} keywords`}
        {contextCount > 0 && `, ${contextCount} context`}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {visibleItems.map((item) => (
          <span
            key={item.label}
            className="inline-block px-2 py-0.5 rounded text-[11px] font-data"
            style={{
              background:
                item.type === 'domain'
                  ? `${category.accent}15`
                  : item.type === 'context'
                  ? 'rgba(96,165,250,0.12)'
                  : `${category.accent}10`,
              color:
                item.type === 'context' ? '#60a5fa' : category.accent,
              border: `1px solid ${
                item.type === 'context'
                  ? 'rgba(96,165,250,0.2)'
                  : `${category.accent}25`
              }`,
            }}
          >
            {item.type === 'context' && '~ '}
            {item.label}
          </span>
        ))}
      </div>

      {allItems.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary text-xs hover:underline self-start mt-auto"
        >
          {expanded ? 'Show less' : `+${allItems.length - 5} more`}
        </button>
      )}

      {category.contextKeywords && (
        <p className="text-on-surface-variant/50 text-[10px] mt-2 leading-relaxed">
          <span className="text-[#60a5fa]">~</span> Context keywords &mdash; only trigger with promotional indicators
        </p>
      )}
    </motion.div>
  );
}

export default function RulesShowcase() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-2xl">shield</span>
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            Detection Arsenal
          </h2>
        </div>
        <p className="text-on-surface-variant text-sm max-w-md mx-auto">
          Multi-layered rule engine with domain blocklists, keyword matching, and context-aware detection.
        </p>
      </motion.div>

      {/* Category cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {categories.map((cat, i) => (
          <CategoryCard key={cat.name} category={cat} index={i} />
        ))}
      </div>

      {/* Unicode evasion demo */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <p className="sentinel-label">Unicode Evasion Handling</p>
        <div className="flex items-center gap-3 bg-surface-container rounded-xl px-5 py-3">
          <span className="font-data text-sm text-on-surface-variant">
            {'\uD835\uDDD4\uD835\uDE00\uD835\uDE00\uD835\uDDFA\uD835\uDDF4\uD835\uDDFB\uD835\uDDFA\uD835\uDDF2\uD835\uDDFB\uD835\uDE01\uD835\uDE00'}
          </span>
          <motion.span
            className="material-symbols-outlined text-primary text-lg"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            arrow_forward
          </motion.span>
          <span className="font-data text-sm text-primary font-semibold">Assignments</span>
          <span className="material-symbols-outlined text-danger text-lg ml-2">gpp_bad</span>
          <span className="text-danger text-xs font-semibold">BLOCKED</span>
        </div>
      </motion.div>
    </section>
  );
}
