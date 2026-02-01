import { useState, useRef } from 'react';
import { FileCode, X } from 'lucide-react';

const LANGUAGES = [
    { id: 'python', name: 'Python', extension: '.py', color: '#3572A5', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
    { id: 'javascript', name: 'JavaScript', extension: '.js', color: '#f7df1e', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400' },
    { id: 'cpp', name: 'C++', extension: '.cpp', color: '#00599C', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
    { id: 'java', name: 'Java', extension: '.java', color: '#b07219', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' },
    { id: 'c', name: 'C', extension: '.c', color: '#555555', bgColor: 'bg-gray-500/20', textColor: 'text-gray-400' }
];

export default function NewFileModal({ isOpen, onClose, onCreate, existingFilenames = [] }) {
    const [filename, setFilename] = useState('');
    const [language, setLanguage] = useState('python');
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    if (!isOpen) return null;

    const selectedLang = LANGUAGES.find(l => l.id === language);

    const getFullFilename = () => {
        if (!filename.trim()) return '';
        const name = filename.trim();
        if (name.includes('.')) return name;
        return name + selectedLang.extension;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const fullFilename = getFullFilename();

        if (!fullFilename) {
            setError('Please enter a filename');
            return;
        }

        if (existingFilenames.includes(fullFilename.toLowerCase())) {
            setError('A file with this name already exists');
            return;
        }

        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(fullFilename)) {
            setError('Filename contains invalid characters');
            return;
        }

        onCreate(fullFilename, language);
        setFilename('');
        setLanguage('python');
        setError('');
        onClose();
    };

    const handleClose = () => {
        setFilename('');
        setLanguage('python');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-[#1e1e1e] border border-[#313244] rounded-xl shadow-2xl w-full max-w-md mx-4 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#313244]">
                    <div className="flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-[#89b4fa]" />
                        <h2 className="text-lg font-semibold text-[#cdd6f4]">Create New File</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-[#313244] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[#a6adc8]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Filename Input with PROMINENT Extension */}
                    <div>
                        <label className="block text-sm text-[#a6adc8] mb-3">
                            Filename
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                ref={inputRef}
                                type="text"
                                value={filename}
                                onChange={(e) => {
                                    setFilename(e.target.value);
                                    setError('');
                                }}
                                placeholder="e.g., helper"
                                className="flex-1 px-4 py-3 bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg text-[#cdd6f4] placeholder-[#6c6c6c] focus:outline-none focus:border-[#89b4fa] transition-colors text-lg"
                                autoFocus
                            />
                            {/* PROMINENT Extension Badge */}
                            <div
                                className={`px-4 py-3 rounded-lg font-bold text-lg ${selectedLang.bgColor} ${selectedLang.textColor} border-2`}
                                style={{ borderColor: selectedLang.color }}
                            >
                                {selectedLang.extension}
                            </div>
                        </div>
                        {error && (
                            <p className="mt-2 text-sm text-[#f38ba8]">{error}</p>
                        )}
                    </div>

                    {/* Language Select */}
                    <div>
                        <label className="block text-sm text-[#a6adc8] mb-3">
                            Language
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.id}
                                    type="button"
                                    onClick={() => setLanguage(lang.id)}
                                    className={`relative px-3 py-3 text-sm rounded-lg transition-all duration-150 border-2 flex flex-col items-center gap-1
                    ${language === lang.id
                                            ? `${lang.bgColor} ${lang.textColor}`
                                            : 'bg-[#2d2d2d] border-[#3c3c3c] text-[#a6adc8] hover:border-[#6c6c6c]'
                                        }`}
                                    style={language === lang.id ? { borderColor: lang.color } : {}}
                                >
                                    <FileCode className="w-5 h-5" style={{ color: lang.color }} />
                                    <span className="text-xs font-medium">{lang.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filename Preview - PROMINENT */}
                    {filename && (
                        <div className="p-4 bg-[#252526] rounded-lg border border-[#3c3c3c]">
                            <div className="flex items-center gap-3">
                                <FileCode className="w-6 h-6" style={{ color: selectedLang.color }} />
                                <div>
                                    <p className="text-xs text-[#6c6c6c] mb-1">Will create:</p>
                                    <p className="text-xl font-semibold" style={{ color: selectedLang.color }}>
                                        {getFullFilename()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 text-sm text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm bg-[#89b4fa] hover:bg-[#b4befe] text-[#1e1e1e] font-semibold rounded-lg transition-colors"
                        >
                            Create File
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
