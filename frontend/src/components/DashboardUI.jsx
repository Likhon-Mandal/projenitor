import React, { useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2, Clock, XCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/* ──────────────────────────────────────────────────────────────────────────
 * Shared, app-style building blocks for the admin / super-admin / member
 * dashboards. Colours come only from theme classes, so light and dark mode
 * both work.
 * ────────────────────────────────────────────────────────────────────────── */

export const DashboardStyles = () => (
    <style>{`
        @keyframes db-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes db-pop  { 0% { opacity: 0; transform: scale(.94); } 100% { opacity: 1; transform: none; } }
        @keyframes db-shine { 0% { transform: translateX(-120%) skewX(-18deg); } 100% { transform: translateX(260%) skewX(-18deg); } }
        .db-rise { animation: db-rise .45s cubic-bezier(.2,.8,.2,1) both; }
        .db-pop  { animation: db-pop .35s cubic-bezier(.2,.9,.3,1.2) both; }
        .db-shine-bar { animation: db-shine 3.6s ease-in-out 1s infinite; }
        .db-tabs { scrollbar-width: none; -ms-overflow-style: none; }
        .db-tabs::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
            .db-rise, .db-pop { animation: none !important; }
            .db-shine-bar { display: none; }
        }
    `}</style>
);

const greetingFor = (t) => {
    const h = new Date().getHours();
    if (h < 5) return t('শুভ রাত্রি', 'Good night');
    if (h < 12) return t('শুভ সকাল', 'Good morning');
    if (h < 17) return t('শুভ অপরাহ্ন', 'Good afternoon');
    return t('শুভ সন্ধ্যা', 'Good evening');
};

/** Gradient greeting card at the top of a dashboard. */
export const DashboardHero = ({
    name, avatarUrl, roleLabel, subtitle, pendingCount = 0, onRefresh, refreshing = false, onAvatarClick, children,
}) => {
    const { t, formatNumber } = useLanguage();
    const initial = (name || 'U').trim().charAt(0).toUpperCase();
    return (
        <section className="db-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-800 via-red-900 to-orange-950 text-white shadow-lg shadow-orange-900/20 p-4 sm:p-6">
            {/* decorative glows + slow golden sheen */}
            <span className="db-shine-bar pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-yellow-400/15 to-transparent" />
            <div className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-yellow-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-orange-500/20 blur-3xl" />

            <div className="relative flex items-start gap-3 sm:gap-4">
                <button
                    type="button"
                    onClick={onAvatarClick}
                    disabled={!onAvatarClick}
                    className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden ring-2 ring-yellow-400/70 shadow-md bg-yellow-400 text-orange-950 font-serif font-black text-2xl flex items-center justify-center disabled:cursor-default active:scale-95 transition-transform"
                    aria-label={name}
                >
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initial}
                </button>

                <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-semibold text-orange-100/80">{greetingFor(t)} 🙏</p>
                    <h1 className="font-serif font-black text-xl sm:text-2xl text-white leading-tight truncate">{name}</h1>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {roleLabel && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                                <ShieldCheck className="w-3 h-3 text-yellow-300" />{roleLabel}
                            </span>
                        )}
                        {pendingCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-400 text-orange-950 text-[10px] sm:text-[11px] font-black">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                {formatNumber(pendingCount)} {t('টি নতুন আবেদন', 'pending')}
                            </span>
                        )}
                    </div>
                </div>

                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="shrink-0 w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center active:scale-90 transition-all disabled:opacity-60"
                        title={t('রিফ্রেশ', 'Refresh')}
                        aria-label={t('রিফ্রেশ', 'Refresh')}
                    >
                        <RefreshCw className={`w-[18px] h-[18px] ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>

            {subtitle && <p className="relative mt-3 text-xs sm:text-sm text-orange-100/80 leading-relaxed">{subtitle}</p>}
            {children && <div className="relative mt-4">{children}</div>}
        </section>
    );
};

const TILE_TINTS = [
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
    'bg-yellow-100 text-yellow-700',
    'bg-emerald-100 text-emerald-700',
    'bg-blue-100 text-blue-700',
    'bg-amber-100 text-amber-700',
    'bg-stone-200 text-stone-700',
];

/** Compact stat tile — 2 per row on phones. */
export const StatTile = ({ icon: Icon, label, value, index = 0, tint }) => (
    <div
        className="db-pop group relative overflow-hidden bg-white rounded-2xl border border-orange-100 shadow-sm p-3 sm:p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
        style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
        <div className="flex items-start justify-between gap-2">
            <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${tint || TILE_TINTS[index % TILE_TINTS.length]} group-hover:scale-110 transition-transform`}>
                {Icon && <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />}
            </span>
        </div>
        <p className="mt-2.5 font-serif font-black text-2xl sm:text-[1.7rem] leading-none text-stone-900">{value ?? '—'}</p>
        <p className="mt-1 text-[11px] sm:text-xs font-semibold text-stone-500 leading-tight line-clamp-2">{label}</p>
    </div>
);

export const StatTileSkeleton = ({ count = 6 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-orange-100 p-3 sm:p-4 h-[106px] sm:h-[118px] animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-orange-100" />
                <div className="mt-3 h-6 w-12 rounded bg-stone-100" />
                <div className="mt-2 h-3 w-20 rounded bg-stone-100" />
            </div>
        ))}
    </>
);

/**
 * Horizontally scrollable segmented tabs that stick under the app bar.
 * tabs: [{ id, label, icon?, badge? }]
 */
export const DashTabs = ({ tabs, active, onChange }) => {
    const { formatNumber } = useLanguage();
    const refs = useRef({});

    useEffect(() => {
        refs.current[active]?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [active]);

    return (
        <div className="sticky top-[calc(3.5rem_+_env(safe-area-inset-top))] md:top-[calc(4rem_+_env(safe-area-inset-top))] z-30 -mx-3 sm:mx-0 px-3 sm:px-0 py-2 bg-background/85 backdrop-blur-md">
            <div role="tablist" className="db-tabs flex gap-1.5 overflow-x-auto snap-x p-1 rounded-2xl bg-white border border-orange-100 shadow-sm">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = active === tab.id;
                    return (
                        <button
                            key={tab.id}
                            ref={(el) => { refs.current[tab.id] = el; }}
                            role="tab"
                            aria-selected={isActive}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={`snap-start shrink-0 min-h-[40px] px-3.5 rounded-xl text-[13px] sm:text-sm font-bold whitespace-nowrap flex items-center gap-1.5 transition-all active:scale-95 ${isActive
                                ? 'bg-gradient-to-r from-orange-700 to-red-800 text-white shadow-md shadow-orange-900/20'
                                : 'text-stone-600 hover:text-orange-800 hover:bg-orange-50'}`}
                        >
                            {Icon && <Icon className="w-4 h-4 shrink-0" />}
                            <span>{tab.label}</span>
                            {tab.badge > 0 && (
                                <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${isActive ? 'bg-yellow-400 text-orange-950' : 'bg-red-600 text-white'}`}>
                                    {formatNumber(tab.badge)}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/** Section title with optional subtitle and right-hand action. */
export const SectionHeader = ({ title, subtitle, icon: Icon, action, count }) => {
    const { formatNumber } = useLanguage();
    return (
        <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
            <div className="min-w-0 flex items-start gap-2.5">
                {Icon && (
                    <span className="mt-0.5 w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                        <Icon className="w-[18px] h-[18px]" />
                    </span>
                )}
                <div className="min-w-0">
                    <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-tight flex items-center gap-2 flex-wrap">
                        <span>{title}</span>
                        {count > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-black">{formatNumber(count)}</span>
                        )}
                    </h2>
                    {subtitle && <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{subtitle}</p>}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
};

/** Pending / approved / rejected / active pill. */
export const StatusBadge = ({ status, approvedLabel }) => {
    const { t } = useLanguage();
    const map = {
        pending: { cls: 'bg-amber-100 text-amber-900 border-amber-200', icon: Clock, label: t('বিবেচনাধীন', 'Pending') },
        approved: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2, label: approvedLabel || t('অনুমোদিত', 'Approved') },
        active: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2, label: t('সক্রিয়', 'Active') },
        rejected: { cls: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: t('প্রত্যাখ্যাত', 'Rejected') },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${s.cls}`}>
            <Icon className="w-3 h-3" />{s.label}
        </span>
    );
};

/** Friendly empty state. */
export const EmptyState = ({ icon: Icon = Sparkles, title, text, action }) => (
    <div className="db-rise flex flex-col items-center text-center gap-2 px-6 py-10 sm:py-14 bg-white rounded-3xl border border-dashed border-orange-200">
        <span className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-1">
            <Icon className="w-7 h-7" />
        </span>
        {title && <h3 className="font-serif font-bold text-base text-stone-800">{title}</h3>}
        {text && <p className="text-xs sm:text-sm text-stone-500 max-w-sm leading-relaxed">{text}</p>}
        {action && <div className="mt-2">{action}</div>}
    </div>
);

/** Small round avatar with initial fallback. */
export const Avatar = ({ src, name, size = 'w-10 h-10', className = '' }) => (
    <span className={`${size} shrink-0 rounded-full overflow-hidden bg-orange-100 text-orange-800 font-bold text-sm flex items-center justify-center ${className}`}>
        {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : (name || '?').trim().charAt(0).toUpperCase()}
    </span>
);
