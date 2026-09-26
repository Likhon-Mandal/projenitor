import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, Edit2, Check, X, Trash2 } from 'lucide-react';

/* ANIMATION STYLES */
const AnimationStyles = () => (
    <style>{`
        @keyframes drawHorizontal {
            from { width: 0; opacity: 0; }
            to { width: 100%; opacity: 1; }
        }
        @keyframes expandHeight {
            from { height: 0; opacity: 0; }
            to { height: 100%; opacity: 1; }
        }
        @keyframes unfoldNodeH {
            from { opacity: 0; transform: translateX(-20px) scale(0.9); }
            to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-draw-h { animation: drawHorizontal 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-expand-h { animation: expandHeight 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards; }
        .animate-unfold-h { animation: unfoldNodeH 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        /* Hide Scrollbar but keep functionality */
        .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }
    `}</style>
);

const levelTitles = {
    'country': 'World / Country',
    'district': 'District',
    'upazila': 'Upazila',
    'village': 'Village',
    'home': 'Home'
};

const LocationNode = ({ node, isActive, isDimmed, onClick, onMapSelect, onEditSubmit, onDeleteSubmit, levelName, index, className, isAdmin }) => {
    const nodeRef = useRef(null);
    const hasChildren = node.children && node.children.length > 0;

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(node.name);

    // We assume levels have a sequential numeric index to handle lines
    const levelIndex = Object.keys(levelTitles).indexOf(levelName) + 1;

    // Removed node-level scroll to prefer container-level centering

    const staggerStyle = {
        animationDelay: `${0.2 + (index * 0.05)}s`,
        opacity: 0
    };

    return (
        <div
            ref={nodeRef}
            className={`flex flex-row items-center relative ${levelIndex > 1 ? 'pl-3 sm:pl-8' : 'pl-0'} pr-3 sm:pr-8 py-1 sm:py-2 animate-unfold-h origin-left shrink-0 ${className || ''}`}
            style={staggerStyle}
        >
            {/* Connector Line LEFT - Extends left to meet the vertical bus */}
            {levelIndex > 1 && (
                <div className="absolute left-0 top-1/2 -translate-y-[1px] h-[2px] w-3 sm:w-8 bg-orange-300 origin-left z-0"></div>
            )}

            {/* CARD */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                className={`
                    relative z-30 flex flex-row items-center justify-between min-w-[140px] sm:min-w-[220px] px-2.5 sm:px-4 py-2 sm:py-4
                    bg-white rounded-xl shadow-sm cursor-pointer 
                    transition-all duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                    border
                    ${isActive
                        ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-lg scale-105 z-50 bg-orange-50'
                        : isDimmed
                            ? 'border-stone-200 opacity-60 scale-95 grayscale-[0.8] hover:grayscale-0 hover:opacity-100 hover:scale-100 bg-white'
                            : 'border-stone-200 hover:border-orange-300 hover:shadow-md hover:scale-105 bg-white'
                    }
                `}
            >
                {/* Active Indicator Left Strip */}
                {isActive && levelIndex > 1 && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 sm:h-8 w-1 bg-orange-500 rounded-r-full"></div>
                )}

                {/* Location Name Info */}
                <div className="flex flex-col text-left flex-1 min-w-0 pr-2">
                    <span className="text-[8px] sm:text-[10px] uppercase font-bold text-stone-400 tracking-wider bg-stone-100 w-fit px-1.5 py-0.5 rounded mb-1">{levelTitles[levelName] || levelName}</span>
                    {isEditing ? (
                        <div className="flex items-center gap-1 mt-1 font-serif" onClick={e => e.stopPropagation()}>
                            <input
                                autoFocus
                                type="text"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && onEditSubmit) {
                                        onEditSubmit(node, editValue, () => setIsEditing(false));
                                    }
                                }}
                                className="w-[100px] sm:w-[140px] border border-orange-300 rounded px-1.5 py-0.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <button onClick={e => {
                                e.stopPropagation();
                                if (onEditSubmit) {
                                    onEditSubmit(node, editValue, () => setIsEditing(false));
                                }
                            }} className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors shadow-sm border border-stone-100 bg-white">
                                <Check size={12} />
                            </button>
                            <button onClick={e => {
                                e.stopPropagation();
                                setIsEditing(false);
                                setEditValue(node.name);
                            }} className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors shadow-sm border border-stone-100 bg-white">
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between group">
                            <span className={`text-xs sm:text-base font-serif font-bold truncate ${isActive ? 'text-orange-900' : 'text-stone-800'}`}>{node.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex p-0.5 ml-1 transition-all space-x-0.5 sm:space-x-1">
                                {isAdmin && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditValue(node.name);
                                            setIsEditing(true);
                                        }}
                                        className="p-1 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                                        title="Rename Location"
                                    >
                                        <Edit2 size={10} />
                                    </button>
                                )}
                                {isAdmin && onDeleteSubmit && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSubmit(node);
                                        }}
                                        className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Delete Location"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dropdown / Arrow Icon */}
                <div className="ml-1 sm:ml-4 flex items-center justify-center">
                    <div className={`
                        w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors duration-300
                        ${isActive ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-400'}
                    `}>
                        <ChevronRight size={10} strokeWidth={3} className={`sm:size-[14px] transition-transform duration-300`} />
                    </div>
                </div>

                {/* Confirm Button for End Node (like home) */}
                {isActive && levelName === 'home' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onMapSelect) onMapSelect(node);
                        }}
                        className={`
                            absolute -bottom-2.5 left-1/2 -translate-x-1/2
                            h-6 sm:h-7 px-3 sm:px-4 rounded-full flex items-center justify-center gap-1
                            border-2 border-white shadow-md transition-transform duration-300 hover:scale-105 active:scale-95 whitespace-nowrap
                            bg-orange-600 text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-wider
                        `}
                        title={`Select ${node.name}`}
                    >
                        View Members
                    </button>
                )}
            </div>

            {/* Connector Line RIGHT - Extends right to touch the vertical bus of next layer */}
            {isActive && hasChildren && (
                <div className="absolute right-0 top-1/2 -translate-y-[1px] h-[2px] w-3 sm:w-8 bg-orange-400 z-0 animate-draw-h origin-left"></div>
            )}
        </div>
    );
};

const LocationTree = ({
    hierarchyData,
    activePath,
    onNodeSelect,
    onConfirmSelection,
    onEditSubmit,
    onDeleteSubmit,
    isAdmin
}) => {

    // Flatten layers based on activePath
    const layers = useMemo(() => {
        const _layers = [hierarchyData];
        let currentLevelNodes = hierarchyData;

        for (let i = 0; i < activePath.length; i++) {
            const activeNodeName = activePath[i]?.name;
            const activeNode = currentLevelNodes.find(n => n.name === activeNodeName);

            if (activeNode && activeNode.children && activeNode.children.length > 0) {
                _layers.push(activeNode.children);
                currentLevelNodes = activeNode.children;
            } else {
                break; // Stop if no children or node not found in current data
            }
        }
        return _layers;
    }, [hierarchyData, activePath]);

    const levelsMapKeys = Object.keys(levelTitles);

    return (
        <div className="w-full relative flex flex-row items-stretch overflow-x-auto overflow-y-auto min-h-[400px] sm:min-h-[500px] hide-scrollbar py-4 sm:py-8 px-2 sm:px-4 lg:px-12 bg-[#fffcf5]">
            <AnimationStyles />

            <div className="flex flex-row items-center gap-0 w-fit h-fit my-auto">
                {layers.map((layerNodes, layerIndex) => {
                    const activeNodeName = activePath[layerIndex]?.name;
                    const hasActiveNode = !!activeNodeName;

                    // Determine level name safely
                    const levelName = layerNodes[0]?.level || levelsMapKeys[layerIndex] || 'unknown';

                    return (
                        <div key={layerIndex} className="flex flex-row items-center relative min-h-full">

                            {/* Vertical Bus Line */}
                            {layerIndex > 0 && layerNodes.length > 1 && (
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-orange-300 z-0 opacity-80 rounded-full animate-expand-h origin-top"></div>
                            )}

                            {/* Column Container */}
                            <div className="flex flex-col justify-center gap-y-3 sm:gap-y-4 py-4 sm:py-8 relative z-10 w-fit">
                                {layerNodes.map((node, index) => (
                                    <LocationNode
                                        key={`${levelName}-${node.name}`}
                                        node={node}
                                        index={index}
                                        isActive={activeNodeName === node.name}
                                        isDimmed={hasActiveNode && node.name !== activeNodeName}
                                        onClick={() => onNodeSelect(node, layerIndex)}
                                        onMapSelect={onConfirmSelection}
                                        onEditSubmit={(editedNode, newName, onSuccess) => {
                                            if (onEditSubmit) {
                                                const parentName = layerIndex > 0 ? activePath[layerIndex - 1]?.name : null;
                                                onEditSubmit(editedNode.level, editedNode.name, newName, parentName).then(success => {
                                                    if (success) onSuccess();
                                                });
                                            }
                                        }}
                                        onDeleteSubmit={(deletedNode) => {
                                            if (onDeleteSubmit) {
                                                onDeleteSubmit(deletedNode.level, deletedNode.name);
                                            }
                                        }}
                                        levelName={levelName}
                                        isAdmin={isAdmin}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LocationTree;
