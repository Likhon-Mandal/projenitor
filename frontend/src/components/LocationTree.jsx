import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import {
    ChevronRight, Edit2, Check, X, Trash2, MapPin, Globe2, Landmark, Building2, Trees, Home as HomeIcon,
    Loader2, Users, ArrowRight, SearchX,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import VerifiedBadge from './VerifiedBadge';

/* ──────────────────────────────────────────────────────────────────────────
 * Lineage location graph (Explorer → "Graph View")
 *
 * Columns: country → district → upazila → village → home.
 * Branches are drawn as animated SVG curves measured from the real card
 * positions; the selected lineage carries a flowing "diya-light" pulse.
 * ────────────────────────────────────────────────────────────────────────── */

const GraphStyles = () => (
    <style>{`
        @keyframes lt-node-in {
            0%   { opacity: 0; transform: translateX(-14px) scale(0.94); filter: blur(4px); }
            60%  { opacity: 1; filter: blur(0); }
            100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
        }
        @keyframes lt-draw   { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes lt-flow   { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -40; } }
        @keyframes lt-halo   { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: .15; transform: scale(1.06); } }
        @keyframes lt-head-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        @keyframes lt-dot    { from { opacity: 0; r: 0; } to { opacity: 1; } }

        .lt-node      { animation: lt-node-in .55s cubic-bezier(.2,.9,.3,1.15) both; }
        .lt-head      { animation: lt-head-in .4s ease-out both; }
        .lt-edge      { stroke-dasharray: 1; stroke-dashoffset: 1; animation: lt-draw .7s cubic-bezier(.65,0,.35,1) forwards; }
        @keyframes lt-fade   { from { opacity: 0; } to { opacity: 1; } }
        .lt-flow      { stroke-dasharray: 4 16; animation: lt-fade .4s ease .7s both, lt-flow 1.1s linear infinite; }
        .lt-halo      { animation: lt-halo 2.4s ease-in-out infinite; }
        .lt-dot       { animation: lt-dot .35s ease-out both; }
        .lt-scroll    { scrollbar-width: none; -ms-overflow-style: none; scroll-behavior: smooth; }
        .lt-scroll::-webkit-scrollbar { display: none; }

        @media (prefers-reduced-motion: reduce) {
            .lt-node, .lt-head, .lt-halo, .lt-dot { animation: none !important; }
            .lt-edge { animation: none !important; stroke-dashoffset: 0; }
            .lt-flow { animation: none !important; }
        }
    `}</style>
);

const LEVELS = {
    country:  { bn: 'দেশ',     en: 'Country',  icon: Globe2,    tile: 'bg-orange-100 text-orange-700',  ring: 'from-orange-500 via-red-600 to-amber-400' },
    district: { bn: 'জেলা',    en: 'District', icon: Landmark,  tile: 'bg-red-100 text-red-700',        ring: 'from-red-600 via-orange-500 to-amber-400' },
    upazila:  { bn: 'উপজেলা',  en: 'Upazila',  icon: Building2, tile: 'bg-amber-100 text-amber-700',    ring: 'from-amber-500 via-orange-500 to-red-600' },
    village:  { bn: 'গ্রাম',    en: 'Village',  icon: Trees,     tile: 'bg-emerald-100 text-emerald-700', ring: 'from-emerald-500 via-amber-400 to-orange-500' },
    home:     { bn: 'বাড়ি',    en: 'Home',     icon: HomeIcon,  tile: 'bg-yellow-100 text-yellow-700',  ring: 'from-yellow-400 via-orange-500 to-red-600' },
};
const LEVEL_ORDER = Object.keys(LEVELS);

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toBn = (n) => String(n).replace(/\d/g, (d) => BN_DIGITS[d]);

/** Layout offset of `el` relative to `ancestor`, ignoring CSS transforms. */
const offsetWithin = (el, ancestor) => {
    let x = 0, y = 0, node = el;
    while (node && node !== ancestor) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
    }
    return { x, y };
};

/* ── Node card ───────────────────────────────────────────────────────────── */
const LocationNode = ({
    node, levelName, index, isActive, isDimmed, isPending, childCount,
    onClick, onMapSelect, onEditSubmit, onDeleteSubmit, isAdmin, cardRef,
}) => {
    const { t, isBn } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(node.name);
    const meta = LEVELS[levelName] || LEVELS.country;
    const Icon = meta.icon;

    const handleKey = (e) => {
        if (isEditing) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    };

    return (
        <div className="lt-node relative" style={{ animationDelay: `${Math.min(index, 10) * 55}ms` }}>
            {/* Soft pulsing halo behind the selected card */}
            {isActive && (
                <div className={`lt-halo pointer-events-none absolute -inset-2 rounded-[22px] bg-gradient-to-r ${meta.ring} opacity-40 blur-lg`} />
            )}

            {/* Gradient frame (selected) */}
            <div
                ref={cardRef}
                className={`relative rounded-2xl p-[1.5px] transition-all duration-300 ${isActive
                    ? `bg-gradient-to-r ${meta.ring} shadow-lg shadow-orange-900/15`
                    : 'bg-transparent'}`}
            >
                <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    aria-label={`${isBn ? meta.bn : meta.en}: ${node.name}`}
                    onClick={(e) => { e.stopPropagation(); if (!isEditing) onClick(); }}
                    onKeyDown={handleKey}
                    className={`group relative flex items-center gap-2 sm:gap-3 w-[156px] sm:w-[232px] px-2 sm:px-3.5 py-2.5 sm:py-3
                        rounded-[15px] cursor-pointer select-none border
                        transition-all duration-300 ease-out
                        ${isActive
                            ? 'bg-white border-transparent'
                            : isDimmed
                                ? 'bg-white/80 border-stone-200 opacity-55 saturate-50 hover:opacity-100 hover:saturate-100 hover:-translate-y-0.5 hover:shadow-md'
                                : 'bg-white border-stone-200 shadow-sm hover:border-orange-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-900/10'}
                        active:scale-[0.98]`}
                >
                    {/* Level icon tile */}
                    <span className={`relative shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${meta.tile}
                        transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
                    </span>

                    {/* Text */}
                    <span className="flex-1 min-w-0 text-left">
                        <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-400 leading-none mb-1">
                            {isBn ? meta.bn : meta.en}
                        </span>
                        {isEditing ? (
                            <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                    autoFocus
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter') onEditSubmit?.(node, editValue, () => setIsEditing(false));
                                        if (e.key === 'Escape') { setIsEditing(false); setEditValue(node.name); }
                                    }}
                                    className="w-full min-w-0 border border-orange-300 rounded-md px-1.5 py-0.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                                />
                                <button type="button" onClick={() => onEditSubmit?.(node, editValue, () => setIsEditing(false))} className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50" aria-label={t('সংরক্ষণ', 'Save')}>
                                    <Check size={13} />
                                </button>
                                <button type="button" onClick={() => { setIsEditing(false); setEditValue(node.name); }} className="p-1 rounded-md text-red-600 hover:bg-red-50" aria-label={t('বাতিল', 'Cancel')}>
                                    <X size={13} />
                                </button>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 min-w-0">
                                <span className={`line-clamp-2 sm:line-clamp-1 break-words font-serif font-bold text-[12.5px] sm:text-[15px] leading-tight ${isActive ? 'text-orange-900' : 'text-stone-800'}`}>
                                    {node.name}
                                </span>
                                <span className="hidden sm:inline-flex shrink-0"><VerifiedBadge size={13} /></span>
                                {levelName === 'home' && node.map_link && (
                                    <a
                                        href={node.map_link.startsWith('http') ? node.map_link : `https://${node.map_link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        title={t('গুগল ম্যাপে দেখুন', 'Open in Google Maps')}
                                        className="text-emerald-600 hover:scale-125 transition-transform"
                                    >
                                        <MapPin size={13} />
                                    </a>
                                )}
                            </span>
                        )}
                    </span>

                    {/* State indicator: spinner / child count / chevron */}
                    <span className={`shrink-0 ${isActive || isPending ? 'flex' : 'hidden sm:flex'} items-center justify-center rounded-full transition-all duration-300
                        ${isActive && childCount > 0
                            ? 'min-w-[24px] h-6 px-1.5 bg-gradient-to-br from-orange-600 to-red-700 text-white text-[11px] font-black shadow-sm'
                            : `w-6 h-6 ${isActive ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-400 group-hover:bg-orange-100 group-hover:text-orange-700'}`}`}
                    >
                        {isPending
                            ? <Loader2 size={13} className="animate-spin" />
                            : isActive && childCount > 0
                                ? (isBn ? toBn(childCount) : childCount)
                                : <ChevronRight size={14} strokeWidth={2.6} className={`transition-transform duration-300 ${isActive ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />}
                    </span>

                    {/* Admin actions */}
                    {isAdmin && !isEditing && (
                        <span className="absolute -top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditValue(node.name); setIsEditing(true); }}
                                className="p-1 rounded-md bg-white border border-stone-200 shadow-sm text-stone-500 hover:text-orange-700"
                                title={t('নাম পরিবর্তন করুন', 'Rename Location')}
                            >
                                <Edit2 size={10} />
                            </button>
                            {onDeleteSubmit && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onDeleteSubmit(node); }}
                                    className="p-1 rounded-md bg-white border border-stone-200 shadow-sm text-stone-500 hover:text-red-600"
                                    title={t('মুছে ফেলুন', 'Delete Location')}
                                >
                                    <Trash2 size={10} />
                                </button>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Home reached: open the household */}
            {isActive && levelName === 'home' && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMapSelect?.(node); }}
                    className="lt-head mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold text-white
                        bg-gradient-to-r from-orange-700 to-red-800 shadow-md shadow-orange-900/25 hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    <Users size={14} />
                    {t('সদস্যদের দেখুন', 'View Members')}
                    <ArrowRight size={14} />
                </button>
            )}
        </div>
    );
};

/* ── Graph ───────────────────────────────────────────────────────────────── */
const LocationTree = ({
    hierarchyData,
    activePath,
    onNodeSelect,
    onConfirmSelection,
    onEditSubmit,
    onDeleteSubmit,
    isAdmin,
}) => {
    const { t, isBn } = useLanguage();
    const scrollRef = useRef(null);
    const contentRef = useRef(null);
    const columnRefs = useRef({});
    const cardRefs = useRef({});
    const [edges, setEdges] = useState({ list: [], w: 0, h: 0 });
    const [pendingKey, setPendingKey] = useState(null);

    // Columns shown: the root list plus the children of each node on the active path
    const { layers, emptyAfter } = useMemo(() => {
        const out = [hierarchyData || []];
        let current = hierarchyData || [];
        let empty = false;
        for (let i = 0; i < activePath.length; i++) {
            const active = current.find((n) => n.name === activePath[i]?.name);
            if (active?.children?.length) {
                out.push(active.children);
                current = active.children;
            } else {
                empty = !!active && active.level !== 'home' && i === out.length - 1;
                break;
            }
        }
        return { layers: out, emptyAfter: empty };
    }, [hierarchyData, activePath]);

    const levelOf = (layerNodes, layerIndex) => layerNodes[0]?.level || LEVEL_ORDER[layerIndex] || 'country';
    const keyOf = (layerIndex, name) => `${layerIndex}::${name}`;

    // Measure card positions and build the curved branch paths
    const measure = useCallback(() => {
        const content = contentRef.current;
        if (!content) return;
        const list = [];
        layers.forEach((layerNodes, i) => {
            if (i === 0) return;
            const parentName = activePath[i - 1]?.name;
            const parentEl = cardRefs.current[keyOf(i - 1, parentName)];
            if (!parentEl) return;
            const p = offsetWithin(parentEl, content);
            const sx = p.x + parentEl.offsetWidth;
            const sy = p.y + parentEl.offsetHeight / 2;
            layerNodes.forEach((child, j) => {
                const el = cardRefs.current[keyOf(i, child.name)];
                if (!el) return;
                const c = offsetWithin(el, content);
                const ex = c.x;
                const ey = c.y + el.offsetHeight / 2;
                const dx = Math.max(18, (ex - sx) * 0.55);
                list.push({
                    key: `${i}::${parentName}->${child.name}`,
                    d: `M ${sx} ${sy} C ${sx + dx} ${sy}, ${ex - dx} ${ey}, ${ex} ${ey}`,
                    end: { x: ex, y: ey },
                    start: { x: sx, y: sy },
                    onPath: activePath[i]?.name === child.name,
                    delay: Math.min(j, 10) * 55,
                });
            });
        });
        setEdges({ list, w: content.scrollWidth, h: content.scrollHeight });
    }, [layers, activePath]);

    useLayoutEffect(() => { measure(); }, [measure]);

    useEffect(() => {
        const content = contentRef.current;
        if (!content || typeof ResizeObserver === 'undefined') return undefined;
        const ro = new ResizeObserver(() => measure());
        ro.observe(content);
        document.fonts?.ready?.then(() => measure());
        return () => ro.disconnect();
    }, [measure]);

    // Keep the newest branch in view: parent column pinned near the left edge
    useEffect(() => {
        const scroller = scrollRef.current;
        if (!scroller) return;
        const parentIndex = Math.max(0, layers.length - 2);
        const col = columnRefs.current[parentIndex];
        const id = window.setTimeout(() => {
            const left = layers.length > 1 && col ? Math.max(0, (contentRef.current?.offsetLeft || 0) + col.offsetLeft - 10) : 0;
            scroller.scrollTo({ left, behavior: 'smooth' });
        }, 120);
        return () => window.clearTimeout(id);
    }, [layers.length]);

    const handleSelect = (node, layerIndex) => {
        const key = keyOf(layerIndex, node.name);
        setPendingKey(key);
        Promise.resolve(onNodeSelect(node, layerIndex)).finally(() => {
            setPendingKey((k) => (k === key ? null : k));
        });
    };

    return (
        <div ref={scrollRef} className="lt-scroll w-full relative overflow-x-auto overflow-y-hidden min-h-[420px] sm:min-h-[520px] px-2.5 sm:px-6 lg:px-10 py-5 sm:py-8">
            <GraphStyles />

            <div ref={contentRef} className="relative flex items-center gap-4 sm:gap-14 w-max min-h-[380px] sm:min-h-[460px] mx-auto">
                {/* Branch curves */}
                <svg
                    className="absolute left-0 top-0 pointer-events-none overflow-visible"
                    width={edges.w}
                    height={edges.h}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="lt-grad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" style={{ stopColor: 'rgb(var(--tx-orange-500))' }} />
                            <stop offset="100%" style={{ stopColor: 'rgb(var(--tx-amber-400))' }} />
                        </linearGradient>
                        <filter id="lt-glow" x="-20%" y="-50%" width="140%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>
                    {edges.list.map((e) => (
                        <g key={e.key}>
                            <path
                                d={e.d}
                                pathLength={1}
                                fill="none"
                                strokeWidth={e.onPath ? 2.5 : 1.6}
                                strokeLinecap="round"
                                className={`lt-edge ${e.onPath ? '' : 'stroke-orange-300/80'}`}
                                stroke={e.onPath ? 'url(#lt-grad)' : undefined}
                                style={{ animationDelay: `${e.delay}ms` }}
                            />
                            {e.onPath && (
                                <path
                                    d={e.d}
                                    fill="none"
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    className="lt-flow stroke-yellow-300"
                                    filter="url(#lt-glow)"
                                />
                            )}
                            <circle cx={e.end.x} cy={e.end.y} r={e.onPath ? 4 : 3}
                                className={`lt-dot ${e.onPath ? 'fill-orange-600' : 'fill-orange-300'}`}
                                style={{ animationDelay: `${e.delay + 450}ms` }} />
                        </g>
                    ))}
                    {/* Origin dots on each expanded parent */}
                    {edges.list.filter((e, i, arr) => arr.findIndex((x) => x.start.x === e.start.x && x.start.y === e.start.y) === i).map((e) => (
                        <circle key={`o-${e.key}`} cx={e.start.x} cy={e.start.y} r={4.5} className="lt-dot fill-orange-600" style={{ stroke: 'rgb(var(--surface))' }} strokeWidth={2} />
                    ))}
                </svg>

                {layers.map((layerNodes, layerIndex) => {
                    const levelName = levelOf(layerNodes, layerIndex);
                    const meta = LEVELS[levelName] || LEVELS.country;
                    const activeName = activePath[layerIndex]?.name;
                    return (
                        <div
                            key={`${layerIndex}-${levelName}`}
                            ref={(el) => { columnRefs.current[layerIndex] = el; }}
                            className="relative z-10 flex flex-col items-start gap-2.5 sm:gap-3.5 py-2"
                        >
                            {/* Column heading */}
                            <div className="lt-head flex items-center gap-1.5 px-2.5 py-1 mb-1 rounded-full bg-white/80 border border-orange-100 shadow-sm text-[10px] sm:text-[11px] font-bold text-stone-500 backdrop-blur-sm">
                                <meta.icon className="w-3 h-3 text-orange-600" />
                                <span>{isBn ? meta.bn : meta.en}</span>
                                <span className="text-orange-700">· {isBn ? toBn(layerNodes.length) : layerNodes.length}</span>
                            </div>

                            {layerNodes.map((node, index) => {
                                const k = keyOf(layerIndex, node.name);
                                const isActive = activeName === node.name;
                                return (
                                    <LocationNode
                                        key={k}
                                        node={node}
                                        levelName={levelName}
                                        index={index}
                                        isActive={isActive}
                                        isDimmed={!!activeName && !isActive}
                                        isPending={pendingKey === k}
                                        childCount={isActive ? (node.children?.length || 0) : 0}
                                        cardRef={(el) => { cardRefs.current[k] = el; }}
                                        onClick={() => handleSelect(node, layerIndex)}
                                        onMapSelect={onConfirmSelection}
                                        onEditSubmit={(editedNode, newName, onSuccess) => {
                                            if (!onEditSubmit) return;
                                            const parentName = layerIndex > 0 ? activePath[layerIndex - 1]?.name : null;
                                            onEditSubmit(editedNode.level, editedNode.name, newName, parentName).then((ok) => { if (ok) onSuccess(); });
                                        }}
                                        onDeleteSubmit={onDeleteSubmit ? (deletedNode) => onDeleteSubmit(deletedNode.level, deletedNode.name) : undefined}
                                        isAdmin={isAdmin}
                                    />
                                );
                            })}
                        </div>
                    );
                })}

                {/* Selected place has nothing below it yet */}
                {emptyAfter && (
                    <div className="lt-node relative z-10 flex flex-col items-center justify-center gap-2 w-[150px] sm:w-[220px] p-4 rounded-2xl border-2 border-dashed border-orange-200 bg-white/60 text-center">
                        <SearchX className="w-6 h-6 text-orange-300" />
                        <p className="text-xs font-semibold text-stone-500">{t('এখানে এখনো কোনো তথ্য যুক্ত হয়নি', 'Nothing has been added here yet')}</p>
                    </div>
                )}

                {/* Empty graph */}
                {layers.length === 1 && layers[0].length === 0 && (
                    <div className="flex flex-col items-center gap-2 text-stone-400 text-sm">
                        <Globe2 className="w-8 h-8 text-orange-200" />
                        {t('কোনো স্থান পাওয়া যায়নি', 'No locations found')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationTree;
