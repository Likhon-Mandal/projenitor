import React, { useState, useEffect } from 'react';
import { ChevronRight, Map, Home, Plus, Edit2, Check, X, Trash2, Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import FamilyTree from '../components/FamilyTree';
import LocationTree from '../components/LocationTree';
import MemberForm from '../components/MemberForm';
import MemberProfileModal from '../components/MemberProfileModal';
import SpousesDirectoryModal from '../components/SpousesDirectoryModal';

import LocationForm from '../components/LocationForm';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const Explorer = () => {
    const { isAdmin } = useAuth();
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
        const displayName = member.name_bangla || member.full_name;
        setConfirmModal({
            isOpen: true,
            title: `${displayName} ও তাঁর অধস্তন শাখা মুছে ফেলবেন?`,
            message: `সতর্কতা: আপনি কি নিশ্চিত যে আপনি ${displayName}-কে মুছে ফেলতে চান? এটি ${displayName}, তাঁর সকল সহধর্মিণী এবং তাঁর অধস্তন বংশলতিকার সকল সন্তান ও পরবর্তী প্রজন্মসমূহ (সম্পূর্ণ সাব-ট্রি) মুছে ফেলবে!`,
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
            title: `Delete ${name}?`,
            message: `WARNING: Are you sure you want to delete ${name}? This will PERMANENTLY delete all sub-locations and family members within this location!`,
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
            }
        } else {
            const parent = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
            fetchOptions(currentLevel, parent);

            // For graphic view, we need a root-down hierarchy based on current path
            if (viewMode === 'graph') {
                buildHierarchyData();
            }
        }
    }, [location.pathname, viewMode]); // Re-run whenever URL or view changes

    const fetchOptions = async (level, parent) => {
        try {
            setLoading(true);
            const res = await api.get('/family/hierarchy', {
                params: { level, parent }
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
        if (currentLevel === 'country') return 'Country';
        if (currentLevel === 'district') return 'District';
        if (currentLevel === 'upazila') return 'Upazila';
        // Union removed
        if (currentLevel === 'village') return 'Village';
        if (currentLevel === 'home') return 'Home';
        return 'Member';
    };

    const handleEditMemberContext = async (id) => {
        try {
            setLoading(true);
            const res = await api.get(`/members/${id}`);
            const memberData = res.data;
            setAddChildContext({ ...memberData, isRoot: !memberData.father_id && !memberData.mother_id });
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
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary mb-1 sm:mb-2">Geographic Lineage Explorer</h1>
                    <p className="text-stone-500 text-sm">Trace roots through the geographical hierarchy.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {currentLevel !== 'details' && (
                        <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200 shadow-inner">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                Grid View
                            </button>
                            <button
                                onClick={() => setViewMode('graph')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'graph' ? 'bg-white shadow-sm text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                Graph View
                            </button>
                        </div>
                    )}

                    {isAdmin && (
                        <button
                            onClick={() => navigate('/recycle-bin')}
                            className="flex items-center gap-2 bg-stone-100 text-stone-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition shadow-sm border border-stone-200"
                        >
                            <Trash2 size={18} /> Recycle Bin
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={handleAddClick}
                            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-sm"
                        >
                            <Plus size={20} /> Add {getNextLevelName()}
                        </button>
                    )}
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-2 text-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                        <button
                            onClick={() => resetToLevel(index)}
                            className={`hover:text-primary font-medium transition-colors duration-200 ${index === breadcrumbs.length - 1 ? 'text-primary font-bold' : 'text-stone-500'}`}
                        >
                            {item}
                        </button>
                        {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-stone-400" />}
                    </React.Fragment>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[200px] relative">
                {currentLevel !== 'details' ? (
                    /* Options Grid */
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            {loading ? (
                                <div className="col-span-full py-10 flex justify-center text-stone-400 animate-pulse">Loading data...</div>
                            ) : options.length > 0 ? (
                                options.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white p-6 rounded-lg shadow-sm border border-orange-100 hover:shadow-md hover:border-accent hover:-translate-y-1 transition duration-300 flex flex-col items-center justify-center text-center space-y-3 group relative"
                                        style={{ animationDelay: `${0.05 * idx}s` }}
                                    >
                                        {editingItem === item ? (
                                            <div className="w-full flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            const parent = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
                                                            const success = await handleEditSubmit(currentLevel, item, editValue, parent);
                                                            if (success) setEditingItem(null);
                                                        }
                                                    }}
                                                    className="w-full border border-orange-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                                <button onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const parent = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
                                                    const success = await handleEditSubmit(currentLevel, item, editValue, parent);
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
                                                    <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingItem(item);
                                                                setEditValue(item);
                                                            }}
                                                            className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-md"
                                                            title="Rename"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteLocation(currentLevel, item);
                                                            }}
                                                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}

                                                <div onClick={() => handleSelect(item)} className="cursor-pointer flex flex-col items-center w-full mt-4">
                                                    {currentLevel === 'home' ? (
                                                        <Home className="h-8 w-8 text-secondary group-hover:scale-110 transition-transform duration-300 mb-3" />
                                                    ) : (
                                                        <Map className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300 mb-3" />
                                                    )}
                                                    <span className="font-serif font-medium text-lg text-stone-800 group-hover:text-primary transition-colors hover:underline underline-offset-4">{item}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 text-stone-400 bg-white rounded-lg border border-dashed border-stone-200">
                                    No data available for this region.
                                </div>
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
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 animate-pulse text-stone-500">Loading hierarchy...</div>
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
                        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-orange-100 border-t-4 border-t-secondary text-center flex flex-col items-center">
                            <Home className="h-14 w-14 text-primary mx-auto mb-3" />
                            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-1">{selection}</h2>
                            <p className="text-stone-500 text-sm mb-4">Family Members in this Household</p>
                            
                            <button
                                onClick={() => {
                                    setSpouseModalHomeFilter(selection);
                                    setIsSpousesModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-orange-800 via-rose-800 to-red-900 text-white font-serif font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:from-orange-700 hover:to-red-800 transition-all duration-300 active:scale-95 group border border-orange-950/30 text-sm cursor-pointer"
                            >
                                <Heart size={16} className="text-yellow-400 fill-yellow-400 group-hover:scale-125 transition-transform duration-300" />
                                <span>সহধর্মিণী তালিকা ({selection})</span>
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
                                    setAddChildContext({ ...member, isRoot: !member.father_id && !member.mother_id });
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
                onClose={() => {
                    setIsProfileOpen(false);
                    setSelectedDetailMember(null);
                }}
                onEdit={(member) => {
                    // Close profile, open form with member data for editing
                    setAddChildContext({ ...member, isRoot: !member.father_id && !member.mother_id });
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
            />

        </div >
    );
};

export default Explorer;
