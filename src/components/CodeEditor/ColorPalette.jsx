import { useState, useRef, useEffect } from 'react';

// 8 Chrome-like colors for tab groups
const GROUP_COLORS = [
    { id: 'gray', value: '#6b7280', name: 'Gray' },
    { id: 'blue', value: '#3b82f6', name: 'Blue' },
    { id: 'red', value: '#ef4444', name: 'Red' },
    { id: 'yellow', value: '#eab308', name: 'Yellow' },
    { id: 'green', value: '#22c55e', name: 'Green' },
    { id: 'pink', value: '#ec4899', name: 'Pink' },
    { id: 'purple', value: '#8b5cf6', name: 'Purple' },
    { id: 'cyan', value: '#06b6d4', name: 'Cyan' }
];

export { GROUP_COLORS };

export default function ColorPalette({ selectedColor, onColorSelect, size = 'md' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    return (
        <div className="flex items-center gap-1.5">
            {GROUP_COLORS.map(color => (
                <button
                    key={color.id}
                    type="button"
                    onClick={() => onColorSelect(color.id)}
                    className={`${sizeClasses[size]} rounded-full transition-all duration-150 border-2 hover:scale-110
            ${selectedColor === color.id
                            ? 'border-white shadow-lg shadow-white/20'
                            : 'border-transparent hover:border-white/30'
                        }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                />
            ))}
        </div>
    );
}

// Helper function to get color value from id
export function getColorValue(colorId) {
    const color = GROUP_COLORS.find(c => c.id === colorId);
    return color ? color.value : GROUP_COLORS[0].value;
}
