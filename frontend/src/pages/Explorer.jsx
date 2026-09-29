import React, { useState, useEffect } from 'react';
import { ChevronRight, Map, Home, Plus, Edit2, Check, X, Trash2, Heart, MapPin, ExternalLink, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import FamilyTree from '../components/FamilyTree';
import LocationTree from '../components/LocationTree';
import MemberForm from '../components/MemberForm';
import MemberProfileModal from '../components/MemberProfileModal';
import SpousesDirectoryModal from '../components/SpousesDirectoryModal';
import BariMapModal from '../components/BariMapModal';

import LocationForm from '../components/LocationForm';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const Explorer = () => {
    const { isAdmin } = useAuth();
    const { t, isBn, formatName } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const [options, setOptions] = useState([]);
    const [hierarchyData, setHierarchyData] = useState([]);
    const [activeGraphPath, setActiveGraphPath] = useState([]);
    const [viewMode, setViewMode] = useState('graph'); // 'grid' or 'graph'
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
    const [addChildContext, setAddChildContext] = useState(null);
    const [selectedDetailMember, setSelectedDetailMember] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSpousesModalOpen, setIsSpousesModalOpen] = useState(false);
    const [spouseModalHomeFilter, setSpouseModalHomeFilter] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const [homeMapLink, setHomeMapLink] = useState('');
    const [isBariMapModalOpen, setIsBariMapModalOpen] = useState(false);
    const [mapModalTarget, setMapModalTarget] = useState({ homeName: '', villageName: '', currentLink: '' });

    const [editingItem, setEditingItem] = useState(null);
    const [editValue, setEditValue] = useState('');

    const handleEditSubmit = async (level, oldName, newName, parentName) => {
        try {
            await api.put('/family/location', { level, oldName, newName, parentName });

            // Refresh view
            if (viewMode === 'grid') {
                const parent = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
                fetchOptions(currentLevel, parent);
            } else {
                buildHierarchyData();
            }
            return true;
        } catch (e) {
            console.error('Error updating:', e);
            alert(e.response?.data?.error || 'Failed to update location');
            return false;
        }
    };

    const handleDeleteMember = (member) => {
        const displayName = formatName(member);
        setConfirmModal({
            isOpen: true,
            title: isBn ? `${displayName} ও তাঁর অধস্তন শাখা মুছে ফেলবেন?` : `Delete ${displayName} and descendants?`,
            message: isBn
                ? `সতর্কতা: আপনি কি নিশ্চিত যে আপনি ${displayName}-কে মুছে ফেলতে চান? এটি ${displayName}, তাঁর সকল সহধর্মিণী এবং তাঁর অধস্তন বংশলতিকার সকল সন্তান ও পরবর্তী প্রজন্মসমূহ (সম্পূর্ণ সাব-ট্রি) মুছে ফেলবে!`
                : `WARNING: Are you sure you want to delete ${displayName}? This will remove ${displayName}, spouses, and the entire descendant subtree!`,
            onConfirm: async () => {
                try {
                    await api.delete(`/members/${member.id}`);

                    // Refresh the details view
                    const homeName = geoContext.home_name || pathSegments[4];
                    const village = geoContext.village || pathSegments[3];
                    if (homeName && village) {
                        fetchHouseholdMembers(homeName, village);
                    }
                } catch (e) {
                    console.error('Error deleting member:', e);
                    alert(e.response?.data?.error || 'Failed to delete member');
                }
            }
        });
    };

    const handleDeleteLocation = (level, name) => {
        setConfirmModal({
            isOpen: true,
            title: isBn ? `${name} মুছে ফেলবেন?` : `Delete ${name}?`,
            message: isBn
                ? `সতর্কতা: আপনি কি নিশ্চিত যে আপনি ${name} মুছে ফেলতে চান? এটি এর অন্তর্ভুক্ত সকল উপ-অঞ্চল এবং সদস্যদের স্থায়ীভাবে মুছে ফেলবে!`
                : `WARNING: Are you sure you want to delete ${name}? This will permanently delete all sub-locations and family members within this location!`,
            onConfirm: async () => {
                try {
                    const parentName = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
                    await api.delete('/family/location', {
                        params: { level, name, parentName }
                    });

                    // Refresh view
                    if (viewMode === 'grid') {
                        fetchOptions(currentLevel, parentName);
                    } else {
                        buildHierarchyData();
                    }
                } catch (e) {
                    console.error('Error deleting:', e);
                    alert(e.response?.data?.error || 'Failed to delete location');
                }
            }
        });
    };

    // Derive State from URL
    // Hierarchy: Country -> District -> Upazila -> Village -> Home -> Details
    const pathSegments = location.pathname.split('/').filter(p => p && p !== 'explorer').map(p => decodeURIComponent(p));

    const levelMap = ['country', 'district', 'upazila', 'village', 'home', 'details'];
    const currentLevel = levelMap[pathSegments.length] || 'country';

    const breadcrumbs = ['World', ...pathSegments];
    const selection = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;

    // Geographic context for new member
    const geoContext = {
        country: pathSegments[0] || 'Bangladesh',
        district: pathSegments[1] || '',
        upazila: pathSegments[2] || '',
        // Union removed
        village: pathSegments[3] || '',
        home_name: pathSegments[4] || ''
    };

    useEffect(() => {
        // Determine what to fetch based on current level derived from URL
        if (currentLevel === 'details') {
            const homeName = pathSegments[4]; // Index shifted
            const village = pathSegments[3]; // Index shifted
            if (homeName && village) {
                fetchHouseholdMembers(homeName, village);
                fetchHomeDetails(homeName, village);
            }
        } else {
            setHomeMapLink('');
            const parent = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
            fetchOptions(currentLevel, parent);

            // For graphic view, we need a root-down hierarchy based on current path
            if (viewMode === 'graph') {
                buildHierarchyData();
            }
        }
    }, [location.pathname, viewMode]); // Re-run whenever URL or view changes

    const fetchHomeDetails = async (homeName, village) => {
        try {
            const res = await api.get('/family/home-details', {
                params: { home_name: homeName, village }
            });
            if (res.data) {
                setHomeMapLink(res.data.map_link || '');
            }
        } catch (error) {
            console.error('Error fetching home details:', error);
        }
    };

    const fetchOptions = async (level, parent) => {
        try {
            setLoading(true);
            const params = { level };
            if (parent) params.parent = parent;
            if (level === 'home') params.include_details = 'true';
            const res = await api.get('/family/hierarchy', {
                params
            });
            setOptions(res.data);
        } catch (error) {
            console.error('Error fetching options:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    const buildHierarchyData = async () => {
        // Build a nested structure starting from the current level's parent, Or root if at country level.
        try {
            setLoading(true);

            if (currentLevel === 'country') {
                // Fetch countries
                const res = await api.get('/family/hierarchy', { params: { level: 'country' } });
                const countries = res.data;
                const rootData = countries.map(c => ({ name: c, level: 'country', children: [] }));
                setHierarchyData(rootData);
                setActiveGraphPath([]);
            } else {
                // We are at a deeper level. We need to construct the path down to the current options.
                // For simplicity in this demo, since we only have the 'hierarchy' endpoint that gives one level at a time,
                // we will build a structure that has the current path as a single lineage, plus the current options as the leaves.

                let rootLevelName = pathSegments[0]; // e.g. Bangladesh

                // Helper function to build nested data
                let currentData = { name: rootLevelName, level: 'country', children: [] };
                let dataRef = currentData;
                let pathArray = [{ name: rootLevelName, level: 'country' }];

                for (let i = 1; i < pathSegments.length; i++) {
                    const nodeName = pathSegments[i];
                    const levelName = levelMap[i];
                    const newNode = { name: nodeName, level: levelName, children: [] };
                    dataRef.children = [newNode];
                    dataRef = newNode;
                    pathArray.push({ name: nodeName, level: levelName });
                }

                // Now fetch the actual options for the *current* level and add them to the leaf
                const parentName = pathSegments[pathSegments.length - 1];
                const res = await api.get('/family/hierarchy', { params: { level: currentLevel, parent: parentName } });
                const currentOptions = res.data;

                dataRef.children = currentOptions.map(opt => ({ name: opt, level: currentLevel, children: [] }));

                setHierarchyData([currentData]);
                setActiveGraphPath(pathArray);
            }
        } catch (error) {
            console.error('Error building hierarchy data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHouseholdMembers = async (homeName, village) => {
        try {
            const res = await api.get('/family/household', {
                params: { home_name: homeName, village }
            });
            setMembers(res.data);
            if (res.data && res.data.length > 0 && res.data[0].home_map_link) {
                setHomeMapLink(res.data[0].home_map_link);
            }
        } catch (error) {
            console.error('Error fetching members:', error);
            setMembers([]);
        }
    };

    const handleSelect = (item) => {
        // Navigate to deeper route
        // Current path + / + new item
        // Remove trailing slash if exists (though useLocation usually cleans it)
        const currentPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
        navigate(`${currentPath}/${encodeURIComponent(item)}`);
    };

    const handleGraphNodeSelect = async (node, layerIndex) => {
        // Toggle logic: If the clicked node is already the active one at this layer, close it (slice the path to before this layer)
        const isAlreadyActive = activeGraphPath[layerIndex]?.name === node.name;
        if (isAlreadyActive) {
            setActiveGraphPath(activeGraphPath.slice(0, layerIndex));
            return;
        }

        // If we click a node in the graph, we fetch its children and expand it in place.
        const newPath = activeGraphPath.slice(0, layerIndex);
        newPath.push({ name: node.name, level: node.level });

        // Look up next level
        const currentLevelIndex = levelMap.indexOf(node.level);
        const nextLevel = levelMap[currentLevelIndex + 1];

        if (nextLevel && nextLevel !== 'details') {
            // Fetch children
            try {
                const res = await api.get('/family/hierarchy', { params: { level: nextLevel, parent: node.name } });
                const childrenNames = res.data;
                node.children = childrenNames.map(c => ({ name: c, level: nextLevel, children: [] }));

                // Trigger re-render by updating state
                setHierarchyData([...hierarchyData]);
                setActiveGraphPath(newPath);

                // Scroll container into middle of screen
                setTimeout(() => {
                    const container = document.getElementById('explorer-graph-container');
                    if (container) {
                        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            } catch (e) {
                console.error(e);
            }
        } else {
            setActiveGraphPath(newPath);
            setTimeout(() => {
                const container = document.getElementById('explorer-graph-container');
                if (container) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    };

    const handleGraphConfirmSelection = (node) => {
        // Actually navigate to this node
        // Reconstruct path
        const pathIndex = activeGraphPath.findIndex(p => p.name === node.name);

        let base = '/explorer';
        if (pathIndex !== -1) {
            // If it's already in the active path, build url up to it
            const subPath = activeGraphPath.slice(0, pathIndex + 1).map(p => encodeURIComponent(p.name)).join('/');
            navigate(`${base}/${subPath}`);
        } else {
            // If it's a leaf node just selected
            const subPath = [...activeGraphPath.map(p => encodeURIComponent(p.name)), encodeURIComponent(node.name)].join('/');
            navigate(`${base}/${subPath}`);
        }
    };

    const resetToLevel = (index) => {
        // Navigate to a higher level based on breadcrumb index.
        // Index 0 = 'Bangladesh' -> /explorer
        // Index 1 = Division -> /explorer/Division
        if (index === 0) {
            navigate('/explorer');
        } else {
            // We need the segments corresponding to this index.
            // breadcrumbs has 'Bangladesh' at 0, so pathSegments start at index 1 of breadcrumbs.
            const targetSegments = pathSegments.slice(0, index);
            const newPath = '/explorer/' + targetSegments.map(s => encodeURIComponent(s)).join('/');
            navigate(newPath);
        }
    };

    const handleAddClick = () => {
        if (currentLevel === 'details') {
            setIsFormOpen(true);
        } else {
            setIsLocationFormOpen(true);
        }
    };

    // Callback for when a location (Country, Div, etc.) is added
    const handleLocationAdded = () => {
        const parent = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
        fetchOptions(currentLevel, parent);
    };

    // Callback for when a Member is added
    const handleMemberAdded = () => {
        if (currentLevel === 'details') {
            fetchHouseholdMembers(geoContext.home_name, geoContext.village);
        }
    };

    // Helper to get readable level name
    const getNextLevelName = () => {
        if (currentLevel === 'country') return t('দেশ', 'Country');
        if (currentLevel === 'district') return t('জেলা', 'District');
        if (currentLevel === 'upazila') return t('উপজেলা', 'Upazila');
        if (currentLevel === 'village') return t('গ্রাম', 'Village');
        if (currentLevel === 'home') return t('বাড়ি', 'Home');
        return t('সদস্য', 'Member');
    };

    // Helper to get name of previous location level to return to
    const getParentReturnTarget = () => {
        if (pathSegments.length === 0) return null;
        if (pathSegments.length === 1) return t('সকল দেশ', 'All Countries');
        return pathSegments[pathSegments.length - 2];
    };

    const handleEditMemberContext = async (id) => {
        try {
            setLoading(true);
            const res = await api.get(`/members/${id}`);
            const isMaleRoot = memberData.gender === 'Male' && !memberData.father_id && !memberData.mother_id && memberData.role !== 'spouse';
            setAddChildContext({ ...memberData, isRoot: isMaleRoot });
        } catch (err) {
            console.error('Error switching member context:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-orange-100 animate-slide-up flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary mb-1 sm:mb-2">{t('ভৌগোলিক বংশধারা পরিভ্রমণ', 'Geographic Lineage Explorer')}</h1>
                    <p className="text-stone-500 text-sm">{t('ভৌগোলিক কাঠামোর মাধ্যমে পূর্বপুরুষ ও আত্মীয়দের সন্ধান করুন।', 'Trace roots through the geographical hierarchy.')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {currentLevel !== 'details' && (
                        <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200 shadow-inner">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary font-bold' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                {t('গ্রিড ভিউ', 'Grid View')}
                            </button>
                            <button
                                onClick={() => setViewMode('graph')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'graph' ? 'bg-white shadow-sm text-primary font-bold' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                {t('গ্রাফ ভিউ', 'Graph View')}
                            </button>
                        </div>
                    )}

                    {isAdmin && (
                        <button
                            onClick={() => navigate('/recycle-bin')}
                            className="flex items-center gap-2 bg-stone-100 text-stone-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition shadow-sm border border-stone-200"
                        >
                            <Trash2 size={18} /> {t('রিসাইকেল বিন', 'Recycle Bin')}
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={handleAddClick}
                            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-sm"
                        >
                            <Plus size={20} /> {isBn ? `${getNextLevelName()} যুক্ত করুন` : `Add ${getNextLevelName()}`}
                        </button>
                    )}
                </div>
            </div>

            {/* Breadcrumbs & Visual Back Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm animate-slide-up bg-white p-3 sm:p-3.5 rounded-xl border border-orange-100 shadow-2xs" style={{ animationDelay: '0.1s' }}>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {pathSegments.length > 0 && (
                        <button
                            onClick={() => resetToLevel(pathSegments.length - 1)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-700 hover:bg-orange-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all duration-200 active:scale-95 group cursor-pointer"
                            title={t('পূর্ববর্তী ভৌগোলিক স্তরে ফিরে যান', 'Go back to previous geographic level')}
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>{t('পেছনে যান', 'Go Back')}</span>
                            {getParentReturnTarget() && (
                                <span className="text-orange-200 font-normal hidden md:inline max-w-[140px] truncate">
                                    ({getParentReturnTarget()})
                                </span>
                            )}
                        </button>
                    )}

                    <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
                        {breadcrumbs.map((item, index) => (
                            <React.Fragment key={index}>
                                <button
                                    onClick={() => resetToLevel(index)}
                                    className={`px-2 py-1 rounded-md transition-colors duration-200 font-medium ${
                                        index === breadcrumbs.length - 1
                                            ? 'text-primary font-bold bg-orange-50'
                                            : 'text-stone-600 hover:text-primary hover:bg-stone-50'
                                    }`}
                                >
                                    {item}
                                </button>
                                {index < breadcrumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-stone-400 shrink-0" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {pathSegments.length > 0 && (
                    <div className="text-xs font-medium text-stone-500 bg-stone-50 px-3 py-1 rounded-full border border-stone-200 hidden sm:block">
                        {t('বর্তমান স্তর', 'Current Level')}: <span className="font-bold text-orange-800">{getNextLevelName()}</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="min-h-[200px] relative">
                {currentLevel !== 'details' ? (
                    /* Options Grid */
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            {loading ? (
                                <div className="col-span-full py-10 flex justify-center text-stone-400 animate-pulse">{t('তথ্য লোড হচ্ছে...', 'Loading data...')}</div>
                            ) : (
                                <>
                                    {/* Quick Return to Previous Level Card in Grid */}
                                    {pathSegments.length > 0 && (
                                        <div
                                            onClick={() => resetToLevel(pathSegments.length - 1)}
                                            className="bg-orange-50/60 hover:bg-orange-100/80 p-6 rounded-xl border-2 border-dashed border-orange-200 hover:border-orange-400 hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer group select-none relative"
                                            title={t('পূর্ববর্তী স্তরে ফিরে যান', 'Go back to previous level')}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-white shadow-2xs border border-orange-200 flex items-center justify-center text-orange-700 group-hover:bg-orange-800 group-hover:text-white group-hover:border-orange-800 transition-all duration-200">
                                                <ArrowLeft size={22} className="group-hover:-translate-x-1.5 transition-transform" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm sm:text-base text-orange-950 font-serif">
                                                    {t('পূর্ববর্তী স্তরে ফিরে যান', 'Back to Previous Level')}
                                                </div>
                                                <div className="text-xs text-orange-750 font-medium mt-0.5 font-sans">
                                                    {getParentReturnTarget() ? `← ${getParentReturnTarget()}` : t('পূর্ববর্তী স্তর', 'Previous Level')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {options.length > 0 ? (
                                        options.map((item, idx) => {
                                    const itemName = typeof item === 'object' ? item.name : item;
                                    const itemMapLink = typeof item === 'object' ? item.map_link : null;
                                    return (
                                    <div
                                        key={idx}
                                        className="bg-white p-6 rounded-lg shadow-sm border border-orange-100 hover:shadow-md hover:border-accent hover:-translate-y-1 transition duration-300 flex flex-col items-center justify-center text-center space-y-3 group relative"
                                        style={{ animationDelay: `${0.05 * idx}s` }}
                                    >
                                        {editingItem === itemName ? (
                                            <div className="w-full flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            const parent = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
                                                            const success = await handleEditSubmit(currentLevel, itemName, editValue, parent);
                                                            if (success) setEditingItem(null);
                                                        }
                                                    }}
                                                    className="w-full border border-orange-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                                <button onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const parent = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
                                                    const success = await handleEditSubmit(currentLevel, itemName, editValue, parent);
                                                    if (success) setEditingItem(null);
                                                }} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingItem(null); }} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Edit & Delete Buttons */}
                                                {isAdmin && (
                                                    <div className="absolute top-1 sm:top-1.5 right-3 sm:right-4 flex space-x-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingItem(itemName);
                                                                setEditValue(itemName);
                                                            }}
                                                            className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-md"
                                                            title={t('নাম পরিবর্তন', 'Rename')}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteLocation(currentLevel, itemName);
                                                            }}
                                                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                                            title={t('মুছুন', 'Delete')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}

                                                <div onClick={() => handleSelect(itemName)} className="cursor-pointer flex flex-col items-center w-full mt-4">
                                                    {currentLevel === 'home' ? (
                                                        <Home className="h-8 w-8 text-secondary group-hover:scale-110 transition-transform duration-300 mb-3" />
                                                    ) : (
                                                        <Map className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300 mb-3" />
                                                    )}
                                                    <span className="font-serif font-medium text-lg text-stone-800 group-hover:text-primary transition-colors hover:underline underline-offset-4">{itemName}</span>
                                                </div>

                                                {/* In every Bari card, show Google Map Option */}
                                                {currentLevel === 'home' && (itemMapLink || isAdmin) && (
                                                    <div className="w-full pt-2 border-t border-orange-100/60 mt-1 flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                        {itemMapLink ? (
                                                            <div className="inline-flex items-center gap-1">
                                                                <a
                                                                    href={itemMapLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-950 border border-emerald-200 transition-all active:scale-95 shadow-2xs group"
                                                                    title={t('গুগল ম্যাপে দেখুন', 'Open in Google Maps')}
                                                                >
                                                                    <MapPin size={12} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                                                                    <span>{t('গুগল ম্যাপ', 'Google Map')}</span>
                                                                    <ExternalLink size={10} className="text-emerald-500 opacity-70" />
                                                                </a>
                                                                {isAdmin && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setMapModalTarget({
                                                                                homeName: itemName,
                                                                                villageName: pathSegments[pathSegments.length - 1] || '',
                                                                                currentLink: itemMapLink
                                                                            });
                                                                            setIsBariMapModalOpen(true);
                                                                        }}
                                                                        className="p-1 text-stone-400 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                                                                        title={t('ম্যাপ লিংক পরিবর্তন করুন', 'Edit Google Map Link')}
                                                                    >
                                                                        <Edit2 size={11} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            isAdmin && (
                                                                <button
                                                                    onClick={() => {
                                                                        setMapModalTarget({
                                                                            homeName: itemName,
                                                                            villageName: pathSegments[pathSegments.length - 1] || '',
                                                                            currentLink: ''
                                                                        });
                                                                        setIsBariMapModalOpen(true);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-stone-500 hover:text-orange-800 hover:bg-orange-50 border border-dashed border-stone-300 hover:border-orange-300 transition-all cursor-pointer active:scale-95 shadow-2xs"
                                                                    title={t('গুগল ম্যাপ লিংক যুক্ত করুন', 'Add Google Map Link')}
                                                                >
                                                                    <MapPin size={11} className="text-orange-600" />
                                                                    <span>+ {t('ম্যাপ লিংক', 'Map Link')}</span>
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-10 px-4 text-stone-400 bg-white rounded-xl border border-dashed border-stone-200 flex flex-col items-center justify-center">
                                    <p className="mb-4">{t('এই অঞ্চলের জন্য কোনো তথ্য নেই।', 'No data available for this region.')}</p>
                                    {pathSegments.length > 0 && (
                                        <button
                                            onClick={() => resetToLevel(pathSegments.length - 1)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-sm active:scale-95 cursor-pointer"
                                        >
                                            <ArrowLeft size={16} />
                                            <span>{t('পূর্ববর্তী স্তরে ফিরে যান', 'Go Back to Previous Level')}</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                        </div>
                    ) : (
                        /* Graph View */
                        <div id="explorer-graph-container" className="bg-[#fffcf5] border border-orange-100 rounded-2xl shadow-inner min-h-[400px] sm:min-h-[500px] overflow-hidden animate-slide-up relative">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                                style={{ backgroundImage: 'linear-gradient(#9a3412 1px, transparent 1px), linear-gradient(90deg, #9a3412 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                            </div>

                            {loading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 animate-pulse text-stone-500">{t('কাঠামো লোড হচ্ছে...', 'Loading hierarchy...')}</div>
                            ) : null}

                            <LocationTree
                                hierarchyData={hierarchyData}
                                activePath={activeGraphPath}
                                onNodeSelect={handleGraphNodeSelect}
                                onConfirmSelection={handleGraphConfirmSelection}
                                onEditSubmit={handleEditSubmit}
                                onDeleteSubmit={handleDeleteLocation}
                                isAdmin={isAdmin}
                            />
                        </div>
                    )
                ) : (
                    /* Household Members View - Family Tree Only */
                    <div className="space-y-6 animate-slide-up">
                        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-orange-100 border-t-4 border-t-secondary text-center flex flex-col items-center relative">
                            {/* Visual Back Navigation to Village / Baris */}
                            <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-orange-100">
                                <button
                                    onClick={() => resetToLevel(pathSegments.length - 1)}
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 hover:border-orange-300 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 hover:shadow-2xs active:scale-95 group cursor-pointer"
                                    title={t('গ্রামের বাড়ি তালিকায় ফিরে যান', 'Back to Village bari list')}
                                >
                                    <ArrowLeft size={16} className="text-orange-700 group-hover:-translate-x-1 transition-transform" />
                                    <span>{isBn ? `${geoContext.village || 'গ্রামে'} ফিরে যান (বাড়ি তালিকা)` : `Back to ${geoContext.village || 'Village'} (Baris)`}</span>
                                </button>
                                <span className="text-xs text-stone-500 font-medium">
                                    {[geoContext.village, geoContext.upazila, geoContext.district].filter(Boolean).join(' • ')}
                                </span>
                            </div>

                            <Home className="h-14 w-14 text-primary mx-auto mb-3" />
                            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-1">{selection}</h2>
                            <p className="text-stone-500 text-sm mb-3">{t('এই বাড়ির সদস্যবৃন্দ', 'Family Members in this Household')}</p>
                            
                            {/* Google Map Link Option for this Bari */}
                            {(homeMapLink || isAdmin) && (
                                <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                                    {homeMapLink ? (
                                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl shadow-2xs">
                                            <a
                                                href={homeMapLink.startsWith('http') ? homeMapLink : `https://${homeMapLink}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-850 hover:text-emerald-950 transition-colors group"
                                                title={t('গুগল ম্যাপে বাড়িটির অবস্থান দেখুন', 'View home location on Google Maps')}
                                            >
                                                <MapPin size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                                                <span>{t('গুগল ম্যাপে অবস্থান', 'View on Google Maps')}</span>
                                                <ExternalLink size={13} className="text-emerald-600/70 group-hover:text-emerald-800" />
                                            </a>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => {
                                                        setMapModalTarget({
                                                            homeName: selection,
                                                            villageName: geoContext.village || pathSegments[3] || '',
                                                            currentLink: homeMapLink
                                                        });
                                                        setIsBariMapModalOpen(true);
                                                    }}
                                                    className="p-1 text-stone-400 hover:text-orange-800 hover:bg-white rounded-lg transition-colors ml-1 border border-transparent hover:border-orange-200 cursor-pointer"
                                                    title={t('ম্যাপ লিংক পরিবর্তন করুন', 'Edit Google Map Link')}
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        isAdmin && (
                                            <button
                                                onClick={() => {
                                                    setMapModalTarget({
                                                        homeName: selection,
                                                        villageName: geoContext.village || pathSegments[3] || '',
                                                        currentLink: ''
                                                    });
                                                    setIsBariMapModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-50 hover:bg-orange-50 text-stone-600 hover:text-orange-900 border border-dashed border-stone-300 hover:border-orange-300 transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs group"
                                                title={t('এই বাড়ির গুগল ম্যাপ লিংক যুক্ত করুন', 'Add Google Map link for this Bari')}
                                            >
                                                <MapPin size={14} className="text-orange-600 group-hover:scale-110 transition-transform" />
                                                <span>+ {t('গুগল ম্যাপ লিংক যুক্ত করুন', 'Add Google Map Link')}</span>
                                            </button>
                                        )
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setSpouseModalHomeFilter(selection);
                                    setIsSpousesModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-orange-800 via-rose-800 to-red-900 text-white font-serif font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:from-orange-700 hover:to-red-800 transition-all duration-300 active:scale-95 group border border-orange-950/30 text-sm cursor-pointer"
                            >
                                <Heart size={16} className="text-yellow-400 fill-yellow-400 group-hover:scale-125 transition-transform duration-300" />
                                <span>{isBn ? `সহধর্মিণী তালিকা` : `Spouses Directory`}</span>
                            </button>
                        </div>

                        <div className="animate-fade-in overflow-x-auto pb-4">
                            <FamilyTree
                                members={members}
                                onAddChild={(parent) => {
                                    setAddChildContext({
                                        father_id: parent.id,
                                        level: (parent.level || 0) + 1,
                                        isRoot: false // Explicitly not root
                                    });
                                    setIsFormOpen(true);
                                }}
                                onViewDetails={(member) => {
                                    setSelectedDetailMember(member);
                                    setIsProfileOpen(true);
                                }}
                                onEditNode={(member) => {
                                    const isMaleRoot = member.gender === 'Male' && !member.father_id && !member.mother_id && !member.isSpouseFlag && member.role !== 'spouse';
                                    setAddChildContext({ ...member, isRoot: isMaleRoot });
                                    setIsFormOpen(true);
                                }}
                                onDeleteNode={handleDeleteMember}
                                onAddRoot={() => {
                                    setAddChildContext({
                                        level: 1,
                                        isRoot: true
                                    });
                                    setIsFormOpen(true);
                                }}
                                isAdmin={isAdmin}
                            />
                        </div>
                    </div>
                )}
            </div >

            {/* Member Form Modal */}
            {/* We need a state to hold specific parent info if 'Add Child' was clicked */}
            <MemberForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setAddChildContext(null); // Reset context on close
                }}
                initialData={addChildContext ? { ...geoContext, ...addChildContext } : geoContext}
                onSuccess={handleMemberAdded}
                onEditMember={handleEditMemberContext}
            />

            <MemberProfileModal
                isOpen={isProfileOpen}
                member={selectedDetailMember}
                relationType={selectedDetailMember?.gender === 'Male' ? 'son' : selectedDetailMember?.gender === 'Female' ? 'daughter' : null}
                onClose={() => {
                    setIsProfileOpen(false);
                    setSelectedDetailMember(null);
                }}
                onEdit={(member) => {
                    // Close profile, open form with member data for editing
                    const isMaleRoot = member.gender === 'Male' && !member.father_id && !member.mother_id && !member.isSpouseFlag && member.role !== 'spouse';
                    setAddChildContext({ ...member, isRoot: isMaleRoot });
                    setIsFormOpen(true);
                }}
                onDelete={(member) => {
                    setIsProfileOpen(false);
                    setSelectedDetailMember(null);
                    handleDeleteMember(member);
                }}
                onAddSpouse={(member) => {
                    setAddChildContext({
                        spouse_id: member.id,
                        gender: member.gender === 'Male' ? 'Female' : 'Male',
                        isRoot: false // Not exactly root if they have a spouse here
                    });
                    setIsProfileOpen(false);
                    setIsFormOpen(true);
                }}
            />

            <LocationForm
                isOpen={isLocationFormOpen}
                onClose={() => setIsLocationFormOpen(false)}
                level={currentLevel}
                parentName={pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null}
                onSuccess={handleLocationAdded}
            />

            <ConfirmModal
                {...confirmModal}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            <SpousesDirectoryModal
                isOpen={isSpousesModalOpen}
                onClose={() => {
                    setIsSpousesModalOpen(false);
                    setSpouseModalHomeFilter(null);
                }}
                currentHome={spouseModalHomeFilter}
                currentVillage={breadcrumbs && breadcrumbs.length >= 5 ? breadcrumbs[4] : null}
                onEdit={(member) => {
                    setIsSpousesModalOpen(false);
                    setAddChildContext({ ...member, isSpouseFlag: true, role: 'spouse', isRoot: false });
                    setIsFormOpen(true);
                }}
            />

            <BariMapModal
                isOpen={isBariMapModalOpen}
                onClose={() => setIsBariMapModalOpen(false)}
                homeName={mapModalTarget.homeName}
                villageName={mapModalTarget.villageName}
                currentLink={mapModalTarget.currentLink}
                onSaved={(newLink) => {
                    if (mapModalTarget.homeName === selection) {
                        setHomeMapLink(newLink);
                    }
                    setOptions(prev => prev.map(opt => {
                        const optName = typeof opt === 'object' ? opt.name : opt;
                        if (optName === mapModalTarget.homeName) {
                            return typeof opt === 'object' ? { ...opt, map_link: newLink } : { name: opt, map_link: newLink };
                        }
                        return opt;
                    }));
                }}
            />

        </div >
    );
};

export default Explorer;
