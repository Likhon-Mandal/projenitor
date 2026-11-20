import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#a0400d', '#a11a1a', '#f8b81a', '#10b981', '#17909f', '#da810d', '#ec4899', '#8a775e'];

const ChartContainer = ({ children, height = 300 }) => {
    const { t } = useLanguage();
    const containerRef = React.useRef(null);
    const [width, setWidth] = React.useState(0);

    React.useEffect(() => {
        if (!containerRef.current) return;

        const updateWidth = () => {
            if (containerRef.current) {
                const clientWidth = containerRef.current.clientWidth;
                if (clientWidth > 0) {
                    setWidth(Math.floor(clientWidth));
                }
            }
        };

        updateWidth();

        const observer = new ResizeObserver((entries) => {
            if (entries && entries[0] && entries[0].contentRect) {
                const w = entries[0].contentRect.width;
                if (w > 0) {
                    setWidth(Math.floor(w));
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full relative min-w-0" style={{ height, minHeight: height }}>
            {width > 0 ? (
                <ResponsiveContainer width={width} height={height}>
                    {children}
                </ResponsiveContainer>
            ) : (
                <div className="w-full h-full animate-pulse bg-orange-50/50 rounded-2xl flex items-center justify-center">
                    <span className="text-xs text-stone-400">{t('চার্ট লোড হচ্ছে...', 'Loading chart...')}</span>
                </div>
            )}
        </div>
    );
};

const DashboardCharts = ({ data }) => {
    const { isDark } = useTheme();
    const chart = isDark
        ? { main: '#f9ab5c', bar: '#fb978c', grid: '#3a2c22', tick: '#bfae93', cursor: '#2a1d15' }
        : { main: '#a0400d', bar: '#a11a1a', grid: '#efe5d6', tick: '#8a775e', cursor: '#fff6ec' };
    const { t } = useLanguage();
    const [isMounted, setIsMounted] = useState(false);
    const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

    useEffect(() => {
        setIsMounted(true);
        const onResize = () => setIsNarrow(window.innerWidth < 640);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Tooltips follow the theme (surface + text colours flip in dark mode)
    const tooltipStyle = {
        borderRadius: '14px',
        border: '1px solid rgb(var(--bd-orange-100))',
        background: 'rgb(var(--surface))',
        color: 'rgb(var(--tx-stone-800))',
        boxShadow: '0 10px 15px -3px rgb(var(--bg-stone-900) / 0.15)',
    };

    if (!data) return null;

    if (!isMounted) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
                <div className="bg-white p-4 sm:p-6 rounded-3xl border border-orange-100 shadow-xs h-[320px] sm:h-[380px] animate-pulse" />
                <div className="bg-white p-4 sm:p-6 rounded-3xl border border-orange-100 shadow-xs h-[320px] sm:h-[380px] animate-pulse" />
                <div className="bg-white p-4 sm:p-6 rounded-3xl border border-orange-100 shadow-xs h-[320px] sm:h-[380px] lg:col-span-2 animate-pulse" />
            </div>
        );
    }

    const hasRegistrations = Array.isArray(data.registrations) && data.registrations.length > 0;
    const hasVillages = Array.isArray(data.villages) && data.villages.length > 0;
    const hasBloodGroups = Array.isArray(data.bloodGroups) && data.bloodGroups.length > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {/* Member Growth Line Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-orange-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300 min-w-0">
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-800 mb-3 sm:mb-6">
                    {t('সদস্য নিবন্ধন প্রবৃদ্ধি', 'Member Registrations')}
                </h3>
                <div className="w-full min-w-0">
                    {hasRegistrations ? (
                        <ChartContainer height={isNarrow ? 240 : 300}>
                            <AreaChart data={data.registrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chart.main} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={chart.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: chart.tick, fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: chart.tick, fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="members"
                                    stroke={chart.main}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorMembers)"
                                />
                            </AreaChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-stone-400 text-sm italic">
                            {t('কোনো নিবন্ধন তথ্য পাওয়া যায়নি', 'No registration data available')}
                        </div>
                    )}
                </div>
            </div>

            {/* Village Distribution Bar Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-orange-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300 min-w-0">
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-800 mb-3 sm:mb-6">
                    {t('শীর্ষ গ্রামসমূহ', 'Top Villages')}
                </h3>
                <div className="w-full min-w-0">
                    {hasVillages ? (
                        <ChartContainer height={isNarrow ? 240 : 300}>
                            <BarChart data={data.villages} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chart.grid} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: chart.tick, fontSize: 12 }}
                                    width={isNarrow ? 78 : 100}
                                />
                                <Tooltip
                                    cursor={{ fill: chart.cursor }}
                                    contentStyle={tooltipStyle}
                                />
                                <Bar
                                    dataKey="value"
                                    fill={chart.bar}
                                    radius={[0, 10, 10, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-stone-400 text-sm italic">
                            {t('কোনো গ্রামের তথ্য পাওয়া যায়নি', 'No village data available')}
                        </div>
                    )}
                </div>
            </div>

            {/* Blood Group Distribution Pie Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-orange-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300 lg:col-span-2 min-w-0">
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-800 mb-3 sm:mb-6 text-center">
                    {t('রক্তের গ্রুপের অনুপাত', 'Blood Group Distribution')}
                </h3>
                <div className="w-full min-w-0">
                    {hasBloodGroups ? (
                        <ChartContainer height={isNarrow ? 240 : 300}>
                            <PieChart>
                                <Pie
                                    data={data.bloodGroups}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={isNarrow ? 48 : 60}
                                    outerRadius={isNarrow ? 78 : 100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.bloodGroups.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                />
                                <Legend verticalAlign={isNarrow ? 'bottom' : 'middle'} align={isNarrow ? 'center' : 'right'} layout={isNarrow ? 'horizontal' : 'vertical'} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-stone-400 text-sm italic">
                            {t('কোনো রক্তের গ্রুপের তথ্য পাওয়া যায়নি', 'No blood group data available')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
