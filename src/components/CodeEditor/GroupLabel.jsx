import { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Edit3,
    Unlink,
    X,
    Download,
    FileText,
    FolderOpen
} from 'lucide-react';
import { getColorValue } from './ColorPalette';
import GroupCreator from './GroupCreator';
import { downloadAsZip, downloadGroupAsPDF } from '../../utils/downloadUtils';

export default function GroupLabel({
    group,
    collapsed,
    tabs = [], // All tabs to filter for this group
    onToggleCollapse,
    onRename,
    onChangeColor,
    onUngroup,
    onCloseGroup,
    isDragOver = false
}) {
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

    // Get tabs belonging to this group
    const groupTabs = tabs.filter(t => t.groupId === group.id);

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Calculate position with boundary checks
        const menuWidth = 220;
        const menuHeight = 280;
        let x = e.clientX;
        let y = e.clientY;

        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 10;
        }

        setContextMenuPos({ x, y });
        setShowContextMenu(true);
    };

    const handleEdit = () => {
        setShowContextMenu(false);
        setShowEditor(true);
    };

    const handleSaveEdit = (name, color) => {
        onRename(group.id, name);
        onChangeColor(group.id, color);
        setShowEditor(false);
    };

    // Download group as source files (ZIP)
    const handleDownloadAsSource = async () => {
        setShowContextMenu(false);
        if (groupTabs.length === 0) return;

        await downloadAsZip(groupTabs, group.name);
    };

    // Download group as PDF
    const handleDownloadAsPDF = () => {
        setShowContextMenu(false);
        if (groupTabs.length === 0) return;

        downloadGroupAsPDF(group.name, groupTabs);
    };

    const handleUngroup = () => {
        setShowContextMenu(false);
        onUngroup(group.id);
    };

    const handleCloseGroup = () => {
        setShowContextMenu(false);
        onCloseGroup(group.id);
    };

    const colorValue = getColorValue(group.color);

    return (
        <div className="relative flex-shrink-0">
            <div
                onClick={onToggleCollapse}
                onContextMenu={handleContextMenu}
                className={`flex items-center gap-1 px-2 py-1 rounded-t cursor-pointer transition-all hover:brightness-110 ${isDragOver ? 'ring-2 ring-white/30' : ''
                    }`}
                style={{
                    backgroundColor: colorValue,
                    color: ['yellow', 'cyan'].includes(group.color) ? '#1e1e1e' : 'white'
                }}
            >
                {collapsed ? (
                    <ChevronRight className="w-3 h-3" />
                ) : (
                    <ChevronDown className="w-3 h-3" />
                )}
                <span className="text-xs font-medium max-w-[100px] truncate">
                    {group.name}
                </span>
                <span className="text-[10px] opacity-70 ml-1">
                    ({groupTabs.length})
                </span>
            </div>

            {/* Context Menu */}
            {showContextMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowContextMenu(false)}
                    />
                    <div
                        className="fixed z-50 bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg shadow-2xl py-1 min-w-[200px] animate-fadeIn"
                        style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
                    >
                        {/* Download Section */}
                        <div className="px-3 py-1.5 text-[10px] text-[#6c6c6c] uppercase tracking-wider">
                            Download
                        </div>

                        <button
                            onClick={handleDownloadAsSource}
                            disabled={groupTabs.length === 0}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#cdd6f4] hover:bg-[#3c3c3c] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4 text-[#a6e3a1]" />
                            Download as source {groupTabs.length > 1 ? '(ZIP)' : ''}
                        </button>

                        <button
                            onClick={handleDownloadAsPDF}
                            disabled={groupTabs.length === 0}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#cdd6f4] hover:bg-[#3c3c3c] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileText className="w-4 h-4 text-[#89b4fa]" />
                            Download as PDF
                        </button>

                        <div className="border-t border-[#3c3c3c] my-1" />

                        {/* Edit Section */}
                        <div className="px-3 py-1.5 text-[10px] text-[#6c6c6c] uppercase tracking-wider">
                            Edit
                        </div>

                        <button
                            onClick={handleEdit}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#cdd6f4] hover:bg-[#3c3c3c] transition-colors text-left"
                        >
                            <Edit3 className="w-4 h-4 text-[#a6adc8]" />
                            Edit group
                        </button>

                        <button
                            onClick={handleUngroup}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#cdd6f4] hover:bg-[#3c3c3c] transition-colors text-left"
                        >
                            <FolderOpen className="w-4 h-4 text-[#a6adc8]" />
                            Ungroup all tabs
                        </button>

                        <div className="border-t border-[#3c3c3c] my-1" />

                        <button
                            onClick={handleCloseGroup}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#f38ba8] hover:bg-[#f38ba8]/10 transition-colors text-left"
                        >
                            <X className="w-4 h-4" />
                            Close group
                        </button>
                    </div>
                </>
            )}

            {/* Edit Popup */}
            {showEditor && (
                <GroupCreator
                    initialName={group.name}
                    initialColor={group.color}
                    mode="edit"
                    position={{ top: contextMenuPos.y, left: contextMenuPos.x }}
                    onCreateGroup={handleSaveEdit}
                    onCancel={() => setShowEditor(false)}
                />
            )}
        </div>
    );
}
