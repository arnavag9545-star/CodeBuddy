import { useState, useRef } from 'react';
import { Plus, X, FileCode, GripVertical } from 'lucide-react';
import { getColorValue } from './ColorPalette';
import GroupLabel from './GroupLabel';
import GroupCreator from './GroupCreator';
import TabContextMenu from './TabContextMenu';

// Get file icon color based on language
const getLanguageColor = (language) => {
    const colors = {
        python: '#3572A5',
        javascript: '#f7df1e',
        cpp: '#00599C',
        java: '#b07219',
        c: '#555555'
    };
    return colors[language] || '#89b4fa';
};

// Generate unique ID
const generateId = () => 'group_' + Date.now() + Math.random().toString(36).substr(2, 9);

export default function TabBar({
    tabs,
    activeTabId,
    tabGroups = [],
    onTabClick,
    onTabClose,
    onCloseOtherTabs,
    onNewTab,
    onTabGroupsChange,
    onTabUpdate,
    onTabsReorder
}) {
    const [contextMenu, setContextMenu] = useState(null);
    const [creatingGroup, setCreatingGroup] = useState(null); // { tabId, position }

    // Drag and drop state
    const [draggedTab, setDraggedTab] = useState(null);
    const [dragOverTab, setDragOverTab] = useState(null);
    const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after'
    const [dragOverGroup, setDragOverGroup] = useState(null);

    const tabRefs = useRef({});

    // Handle right-click on tab
    const handleTabContextMenu = (e, tab) => {
        e.preventDefault();
        setContextMenu({
            position: { x: e.clientX, y: e.clientY },
            tab
        });
    };

    // Add tab to new group - now captures position
    const handleAddToNewGroup = (tabId) => {
        const tabElement = tabRefs.current[tabId];
        if (tabElement) {
            const rect = tabElement.getBoundingClientRect();
            setCreatingGroup({
                tabId,
                position: {
                    top: rect.bottom + 8,
                    left: rect.left
                }
            });
        } else {
            // Fallback position
            setCreatingGroup({
                tabId,
                position: { top: 100, left: 100 }
            });
        }
    };

    // Create the new group
    const handleCreateGroup = (name, color) => {
        if (!creatingGroup) return;

        const newGroup = {
            id: generateId(),
            name,
            color,
            collapsed: false
        };

        const newGroups = [...tabGroups, newGroup];
        onTabGroupsChange(newGroups);
        onTabUpdate(creatingGroup.tabId, { groupId: newGroup.id });
        setCreatingGroup(null);
    };

    // Add tab to existing group
    const handleAddToGroup = (tabId, groupId) => {
        // Verify group exists
        const groupExists = tabGroups.some(g => g.id === groupId);
        if (groupExists) {
            onTabUpdate(tabId, { groupId });
        }
    };

    // Remove tab from group
    const handleRemoveFromGroup = (tabId) => {
        onTabUpdate(tabId, { groupId: null });

        // Check if this was the last tab in the group
        const tab = tabs.find(t => t.id === tabId);
        if (tab && tab.groupId) {
            const remainingTabsInGroup = tabs.filter(t => t.groupId === tab.groupId && t.id !== tabId);
            if (remainingTabsInGroup.length === 0) {
                // Remove the empty group
                onTabGroupsChange(tabGroups.filter(g => g.id !== tab.groupId));
            }
        }
    };

    // Toggle group collapse
    const handleToggleCollapse = (groupId) => {
        onTabGroupsChange(tabGroups.map(g =>
            g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
        ));
    };

    // Rename group
    const handleRenameGroup = (groupId, newName) => {
        onTabGroupsChange(tabGroups.map(g =>
            g.id === groupId ? { ...g, name: newName } : g
        ));
    };

    // Change group color
    const handleChangeColor = (groupId, newColor) => {
        onTabGroupsChange(tabGroups.map(g =>
            g.id === groupId ? { ...g, color: newColor } : g
        ));
    };

    // Ungroup all tabs in a group (keeps tabs, removes group)
    const handleUngroupAll = (groupId) => {
        // First update all tabs to remove groupId
        tabs.forEach(tab => {
            if (tab.groupId === groupId) {
                onTabUpdate(tab.id, { groupId: null });
            }
        });

        // Then remove the group
        onTabGroupsChange(tabGroups.filter(g => g.id !== groupId));
    };

    // Close all tabs in a group AND delete the group
    const handleCloseGroup = (groupId) => {
        // Get tabs in this group
        const tabsInGroup = tabs.filter(t => t.groupId === groupId);

        // Close each tab
        tabsInGroup.forEach(tab => onTabClose(tab.id));

        // Remove the group completely
        onTabGroupsChange(tabGroups.filter(g => g.id !== groupId));
    };

    // ===== DRAG AND DROP HANDLERS =====

    const handleDragStart = (e, tab, index) => {
        setDraggedTab({ tab, index });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tab.id);

        // Create custom drag image
        const dragImage = e.currentTarget.cloneNode(true);
        dragImage.style.opacity = '0.8';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 20, 20);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragEnd = () => {
        setDraggedTab(null);
        setDragOverTab(null);
        setDropPosition(null);
        setDragOverGroup(null);
    };

    const handleDragOver = (e, tab, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (!draggedTab || draggedTab.tab.id === tab.id) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        const position = e.clientX < midpoint ? 'before' : 'after';

        setDragOverTab(tab.id);
        setDropPosition(position);
    };

    const handleDragLeave = (e) => {
        // Only clear if leaving the tab entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverTab(null);
            setDropPosition(null);
        }
    };

    const handleDrop = (e, targetTab, targetIndex) => {
        e.preventDefault();

        if (!draggedTab || draggedTab.tab.id === targetTab.id) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        const insertAfter = e.clientX > midpoint;

        // Reorder tabs
        const newTabs = [...tabs];
        const draggedIndex = newTabs.findIndex(t => t.id === draggedTab.tab.id);
        const [removed] = newTabs.splice(draggedIndex, 1);

        let insertIndex = newTabs.findIndex(t => t.id === targetTab.id);
        if (insertAfter) insertIndex++;

        newTabs.splice(insertIndex, 0, removed);

        // If target is in a group, add dragged tab to that group
        if (targetTab.groupId && targetTab.groupId !== draggedTab.tab.groupId) {
            removed.groupId = targetTab.groupId;
        }

        if (onTabsReorder) {
            onTabsReorder(newTabs);
        }

        handleDragEnd();
    };

    // Group drop handlers
    const handleGroupDragOver = (e, groupId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverGroup(groupId);
    };

    const handleGroupDragLeave = () => {
        setDragOverGroup(null);
    };

    const handleGroupDrop = (e, groupId) => {
        e.preventDefault();

        if (draggedTab) {
            onTabUpdate(draggedTab.tab.id, { groupId });
        }

        setDragOverGroup(null);
        handleDragEnd();
    };

    // Drop zone for removing from group (ungrouped area)
    const handleUngroupedAreaDrop = (e) => {
        e.preventDefault();

        if (draggedTab && draggedTab.tab.groupId) {
            onTabUpdate(draggedTab.tab.id, { groupId: null });
        }

        handleDragEnd();
    };

    // Organize tabs
    const organizedTabs = () => {
        const ungrouped = tabs.filter(t => !t.groupId);
        const grouped = {};

        // Only include groups that actually exist
        tabGroups.forEach(group => {
            grouped[group.id] = tabs.filter(t => t.groupId === group.id);
        });

        return { ungrouped, grouped };
    };

    const { ungrouped, grouped } = organizedTabs();

    // Get flat index of a tab
    const getTabIndex = (tabId) => tabs.findIndex(t => t.id === tabId);

    // Render a single tab
    const renderTab = (tab, groupColor = null) => {
        const isActive = activeTabId === tab.id;
        const colorValue = groupColor ? getColorValue(groupColor) : null;
        const isDragging = draggedTab?.tab.id === tab.id;
        const isDropTarget = dragOverTab === tab.id;
        const tabIndex = getTabIndex(tab.id);

        return (
            <div
                key={tab.id}
                ref={el => tabRefs.current[tab.id] = el}
                onClick={() => onTabClick(tab.id)}
                onContextMenu={(e) => handleTabContextMenu(e, tab)}
                draggable
                onDragStart={(e) => handleDragStart(e, tab, tabIndex)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, tab, tabIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tab, tabIndex)}
                className={`group relative flex items-center gap-2 px-4 py-2 cursor-grab transition-all duration-150 border-r border-[#313244] min-w-[120px] max-w-[200px] select-none
          ${isActive ? 'bg-[#2d2d2d]' : 'bg-transparent hover:bg-[#252526]'}
          ${isDragging ? 'opacity-50 bg-[#3c3c3c]' : ''}
          ${isDropTarget ? 'bg-[#89b4fa]/10' : ''}`}
                style={colorValue ? {
                    borderTop: `2px solid ${colorValue}`,
                    backgroundColor: isActive ? `${colorValue}15` : isDragging ? '#3c3c3c' : undefined
                } : undefined}
            >
                {/* Drop indicator - before */}
                {isDropTarget && dropPosition === 'before' && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#3b82f6] z-10" />
                )}

                {/* Active indicator */}
                {isActive && !groupColor && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#89b4fa]"></div>
                )}

                {/* Drag handle (subtle) */}
                <GripVertical className="w-3 h-3 text-[#4c4c4c] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />

                {/* File icon */}
                <FileCode
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: getLanguageColor(tab.language) }}
                />

                {/* Filename */}
                <span className={`text-sm truncate ${isActive ? 'text-[#cdd6f4]' : 'text-[#a6adc8]'}`}>
                    {tab.filename}
                </span>

                {/* Close button */}
                {tabs.length > 1 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTabClose(tab.id);
                        }}
                        className={`ml-auto p-0.5 rounded hover:bg-[#3c3c3c] transition-colors
              ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        title="Close tab"
                    >
                        <X className="w-3.5 h-3.5 text-[#a6adc8] hover:text-[#f38ba8]" />
                    </button>
                )}

                {/* Drop indicator - after */}
                {isDropTarget && dropPosition === 'after' && (
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-[#3b82f6] z-10" />
                )}
            </div>
        );
    };

    // Filter out any groups that have no tabs (cleanup orphan groups)
    const activeGroups = tabGroups.filter(group =>
        tabs.some(tab => tab.groupId === group.id)
    );

    return (
        <div className="relative flex items-end bg-[#1e1e1e] border-b border-[#313244] overflow-x-auto scrollbar-thin">
            {/* Ungrouped tabs - drop zone */}
            <div
                className={`flex items-end ${draggedTab?.tab.groupId ? 'min-w-[50px]' : ''}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={handleUngroupedAreaDrop}
            >
                {ungrouped.map(tab => renderTab(tab))}
            </div>

            {/* Grouped tabs - only show groups that exist and have tabs */}
            {activeGroups.map(group => {
                const groupTabs = grouped[group.id] || [];
                if (groupTabs.length === 0) return null;

                const isGroupDragOver = dragOverGroup === group.id;

                return (
                    <div
                        key={group.id}
                        className={`flex items-end transition-all duration-150 ${isGroupDragOver ? 'bg-[#89b4fa]/10 rounded-t' : ''
                            }`}
                        onDragOver={(e) => handleGroupDragOver(e, group.id)}
                        onDragLeave={handleGroupDragLeave}
                        onDrop={(e) => handleGroupDrop(e, group.id)}
                    >
                        {/* Group Label - now receives tabs for download functionality */}
                        <GroupLabel
                            group={group}
                            collapsed={group.collapsed}
                            tabs={tabs}
                            onToggleCollapse={() => handleToggleCollapse(group.id)}
                            onRename={handleRenameGroup}
                            onChangeColor={handleChangeColor}
                            onUngroup={handleUngroupAll}
                            onCloseGroup={handleCloseGroup}
                            isDragOver={isGroupDragOver}
                        />

                        {/* Tabs in group */}
                        {!group.collapsed && groupTabs.map(tab => renderTab(tab, group.color))}

                        {/* Collapsed indicator */}
                        {group.collapsed && (
                            <div
                                className="px-2 py-1 text-xs text-[#6c6c6c] border-r border-[#313244]"
                                style={{ borderTop: `2px solid ${getColorValue(group.color)}` }}
                            >
                                {groupTabs.length} tab{groupTabs.length !== 1 ? 's' : ''}
                            </div>
                        )}

                        {/* Drop hint when dragging over group */}
                        {isGroupDragOver && draggedTab && !groupTabs.find(t => t.id === draggedTab.tab.id) && (
                            <div className="px-2 py-1 text-xs text-[#89b4fa] animate-pulse">
                                + Add to {group.name}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* New Tab Button */}
            <button
                onClick={onNewTab}
                className="flex items-center justify-center w-9 h-9 hover:bg-[#252526] transition-colors flex-shrink-0"
                title="New file (Ctrl+N)"
            >
                <Plus className="w-4 h-4 text-[#a6adc8] hover:text-[#cdd6f4]" />
            </button>

            {/* Context Menu - only pass valid groups */}
            {contextMenu && (
                <TabContextMenu
                    position={contextMenu.position}
                    tab={contextMenu.tab}
                    tabGroups={activeGroups}
                    onClose={() => setContextMenu(null)}
                    onAddToNewGroup={(tabId) => {
                        handleAddToNewGroup(tabId);
                        setContextMenu(null);
                    }}
                    onAddToGroup={handleAddToGroup}
                    onRemoveFromGroup={handleRemoveFromGroup}
                    onCloseTab={onTabClose}
                    onCloseOtherTabs={onCloseOtherTabs}
                />
            )}

            {/* Group Creator - Fixed position near tab */}
            {creatingGroup && (
                <GroupCreator
                    mode="create"
                    position={creatingGroup.position}
                    onCreateGroup={handleCreateGroup}
                    onCancel={() => setCreatingGroup(null)}
                />
            )}
        </div>
    );
}
