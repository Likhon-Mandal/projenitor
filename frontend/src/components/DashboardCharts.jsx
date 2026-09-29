import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#9a3412', '#991b1b', '#eab308', '#10b981', '#6366f1', '#a855f7', '#ec4899', '#64748b'];

const DashboardCharts = ({ data }) => {
    if (!data) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Member Growth Line Chart */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm min-w-0">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-6">Member Registrations</h3>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={data.registrations}>
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
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Village Distribution Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm min-w-0">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-6">Top Villages</h3>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={data.villages} layout="vertical">
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
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Blood Group Distribution Pie Chart */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm lg:col-span-2 min-w-0">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-6 text-center">Blood Group Distribution</h3>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
