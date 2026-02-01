import { useState, useRef, useEffect } from 'react';
import ColorPalette from './ColorPalette';

export default function GroupCreator({
    onCreateGroup,
    onCancel,
    initialName = '',
    initialColor = 'blue',
    mode = 'create',
    position = null // { top, left } for fixed positioning
}) {
    const [groupName, setGroupName] = useState(initialName);
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                handleSubmit();
            }
        }
        // Small delay to prevent immediate close
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [groupName, selectedColor]);

    // Close on escape
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                onCancel();
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const handleSubmit = () => {
        const name = groupName.trim() || 'Unnamed Group';
        onCreateGroup(name, selectedColor);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    // Calculate position with boundary checks
    const getPositionStyle = () => {
        if (!position) return {};

        // Ensure popup stays within viewport
        const popupWidth = 220;
        const popupHeight = 160;

        let left = position.left;
        let top = position.top;

        // Check right boundary
        if (left + popupWidth > window.innerWidth - 20) {
            left = window.innerWidth - popupWidth - 20;
        }

        // Check left boundary
        if (left < 20) {
            left = 20;
        }

        // Check bottom boundary
        if (top + popupHeight > window.innerHeight - 20) {
            top = position.top - popupHeight - 10; // Show above instead
        }

        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: 1000
        };
    };

    return (
        <div
            ref={containerRef}
            className="animate-fadeIn"
            style={getPositionStyle()}
        >
            <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg shadow-2xl p-3 min-w-[200px]">
                {/* Arrow pointer */}
                <div
                    className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-[#3c3c3c]"
                    style={{ filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.3))' }}
                />
                <div
                    className="absolute -top-[6px] left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-[#2d2d2d]"
                />

                <div className="text-xs text-[#a6adc8] mb-2 font-medium">
                    {mode === 'create' ? 'Name this group' : 'Edit group'}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter group name"
                    className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg text-[#cdd6f4] text-sm placeholder-[#6c6c6c] focus:outline-none focus:border-[#89b4fa] mb-3"
                />

                <div className="text-xs text-[#6c6c6c] mb-2">Select color:</div>
                <ColorPalette
                    selectedColor={selectedColor}
                    onColorSelect={setSelectedColor}
                    size="md"
                />

                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[#3c3c3c]">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-xs text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#3c3c3c] rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-3 py-1.5 text-xs bg-[#89b4fa] hover:bg-[#b4befe] text-[#1e1e1e] font-medium rounded transition-colors"
                    >
                        {mode === 'create' ? 'Create' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
