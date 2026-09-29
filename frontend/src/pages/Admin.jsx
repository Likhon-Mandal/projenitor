import React, { useState, useEffect } from 'react';
import MemberForm from '../components/MemberForm';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const Admin = () => {
    const { formatName } = useLanguage();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // MemberForm State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [initialFormData, setInitialFormData] = useState({});

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await api.get('/members');
            setMembers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = () => {
        setInitialFormData({}); // Reset for new entry
        setIsFormOpen(true);
    };

    const handleEdit = (member) => {
        const isSpouse = member.gender === 'Female' && (!member.father_id || member.spouse_id);
        const isMaleRoot = member.gender === 'Male' && !member.father_id;
        setInitialFormData({
            ...member,
            isSpouseFlag: isSpouse,
            role: isSpouse ? 'spouse' : member.role,
            isRoot: isMaleRoot
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This might break the family tree!')) return;
        try {
            await api.delete(`/members/${id}`);
            fetchMembers();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || err.message);
        }
    };

    const handleFormSuccess = () => {
        fetchMembers();
    };

    const filteredMembers = members.filter(m =>
        (m.full_name && m.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.name_bangla && m.name_bangla.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.name_english && m.name_english.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-orange-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-serif text-orange-900 font-bold">Admin Dashboard</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
                    >
                        <Plus size={20} /> Add New Member
                    </button>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 mb-6 flex items-center gap-3">
                    <Search className="text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search members by Bangla or English name..."
                        className="flex-1 outline-none text-stone-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-xl shadow-md border border-orange-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-orange-100 text-orange-900 font-serif">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Level</th>
                                <th className="p-4">Father</th>
                                <th className="p-4">Home</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-stone-500">Loading...</td></tr>
                            ) : filteredMembers.slice(0, 50).map(member => (
                                <tr key={member.id} className="hover:bg-orange-50/50 transition">
                                    <td className="p-4 font-medium text-stone-800">
                                        <div>{formatName(member)}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
                                            Gen {member.level}
                                        </span>
                                    </td>
                                    <td className="p-4 text-stone-500 text-sm">
                                        {formatName(members.find(m => m.id === member.father_id)) || '-'}
                                    </td>
                                    <td className="p-4 text-stone-500 text-sm">{member.home_name}</td>
                                    <td className="p-4 flex gap-3">
                                        <button onClick={() => handleEdit(member)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <MemberForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialData={initialFormData}
                onSuccess={handleFormSuccess}
            />
        </div>
    );
};

export default Admin;
