import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#9a3412', '#991b1b', '#eab308', '#10b981', '#6366f1', '#a855f7', '#ec4899', '#64748b'];

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
    const { t } = useLanguage();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!data) return null;

    if (!isMounted) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs h-[380px] animate-pulse" />
                <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs h-[380px] animate-pulse" />
                <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs h-[380px] lg:col-span-2 animate-pulse" />
            </div>
        );
    }

    const hasRegistrations = Array.isArray(data.registrations) && data.registrations.length > 0;
    const hasVillages = Array.isArray(data.villages) && data.villages.length > 0;
    const hasBloodGroups = Array.isArray(data.bloodGroups) && data.bloodGroups.length > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Member Growth Line Chart */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300 min-w-0">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-6">
                    {t('সদস্য নিবন্ধন প্রবৃদ্ধি', 'Member Registrations')}
                </h3>
                <div className="w-full min-w-0">
                    {hasRegistrations ? (
                        <ChartContainer height={300}>
                            <AreaChart data={data.registrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9a3412" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#9a3412" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="members"
                                    stroke="#9a3412"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorMembers)"
                                />
                            </AreaChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-stone-400 text-sm italic">
                            {t('কোনো নিবন্ধন তথ্য পাওয়া যায়নি', 'No registration data available')}
                        </div>
                    )}
                </div>
            </div>

            {/* Village Distribution Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300 min-w-0">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-6">
                    {t('শীর্ষ গ্রামসমূহ', 'Top Villages')}
                </h3>
                <div className="w-full min-w-0">
                    {hasVillages ? (
                        <ChartContainer height={300}>
                            <BarChart data={data.villages} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: '#fff7ed' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#991b1b"
                                    radius={[0, 10, 10, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-stone-400 text-sm italic">
                            {t('কোনো গ্রামের তথ্য পাওয়া যায়নি', 'No village data available')}
                        </div>
                    )}
                </div>
            </div>

            {/* Blood Group Distribution Pie Chart */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300 lg:col-span-2 min-w-0">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-6 text-center">
                    {t('রক্তের গ্রুপের অনুপাত', 'Blood Group Distribution')}
                </h3>
                <div className="w-full min-w-0">
                    {hasBloodGroups ? (
                        <ChartContainer height={300}>
                            <PieChart>
                                <Pie
                                    data={data.bloodGroups}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.bloodGroups.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-stone-400 text-sm italic">
                            {t('কোনো রক্তের গ্রুপের তথ্য পাওয়া যায়নি', 'No blood group data available')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
