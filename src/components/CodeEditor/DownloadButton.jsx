import { useState, useRef, useEffect } from 'react';
import { Download, FileCode, FileText, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Language to file extension mapping
const LANGUAGE_EXTENSIONS = {
    python: '.py',
    javascript: '.js',
    cpp: '.cpp',
    java: '.java',
    c: '.c'
};

export default function DownloadButton({ code, filename, language }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Download as source file
    const downloadAsSource = () => {
        if (!code) {
            alert('No code to download. Please write some code first.');
            return;
        }

        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    // Download as PDF
    const downloadAsPDF = () => {
        if (!code) {
            alert('No code to download. Please write some code first.');
            return;
        }

        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Page settings
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const lineHeight = 5;
            let yPosition = margin;
            let pageNumber = 1;

            // Header background
            doc.setFillColor(30, 30, 46); // Dark theme color
            doc.rect(0, 0, pageWidth, 20, 'F');

            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(205, 214, 244); // Light text
            doc.text(filename, margin, 13);

            // Language badge
            doc.setFontSize(10);
            doc.setTextColor(137, 180, 250); // Accent color
            doc.text(language.toUpperCase(), pageWidth - margin - 15, 13);

            // Reset for code content
            yPosition = 30;
            doc.setFont('courier', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(205, 214, 244);

            // Add background for code area
            doc.setFillColor(24, 24, 37);
            doc.rect(margin - 5, 25, pageWidth - 2 * margin + 10, pageHeight - 40, 'F');

            // Split code into lines
            const lines = code.split('\n');

            lines.forEach((line, index) => {
                // Check if we need a new page
                if (yPosition > pageHeight - 25) {
                    // Page number at bottom
                    doc.setFontSize(8);
                    doc.setTextColor(108, 108, 108);
                    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

                    // New page
                    doc.addPage();
                    pageNumber++;

                    // Code background on new page
                    doc.setFillColor(24, 24, 37);
                    doc.rect(margin - 5, margin - 5, pageWidth - 2 * margin + 10, pageHeight - 2 * margin + 10, 'F');

                    yPosition = margin;
                }

                // Line number
                doc.setTextColor(108, 108, 108);
                doc.setFontSize(8);
                const lineNum = String(index + 1).padStart(3, ' ');
                doc.text(lineNum, margin, yPosition);

                // Code line
                doc.setTextColor(205, 214, 244);
                doc.setFontSize(9);

                // Truncate long lines
                const maxChars = 85;
                const displayLine = line.length > maxChars ? line.substring(0, maxChars) + '...' : line;
                doc.text(displayLine, margin + 12, yPosition);

                yPosition += lineHeight;
            });

            // Final page number
            doc.setFontSize(8);
            doc.setTextColor(108, 108, 108);
            doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Generate timestamp
            const now = new Date();
            const timestamp = now.toLocaleString();
            doc.setFontSize(7);
            doc.text(`Generated: ${timestamp}`, margin, pageHeight - 10);

            // Save the PDF
            const pdfFilename = filename.replace(/\.[^/.]+$/, '') + '.pdf';
            doc.save(pdfFilename);
            setIsOpen(false);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    const ext = LANGUAGE_EXTENSIONS[language] || '.txt';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3c3c3c] hover:bg-[#4c4c4c] rounded-lg transition-colors duration-200"
                title="Download code"
            >
                <Download className="w-4 h-4 text-[#a6adc8]" />
                <ChevronDown className={`w-3 h-3 text-[#6c6c6c] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn">
                    <button
                        onClick={downloadAsSource}
                        className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 text-[#cdd6f4] hover:bg-[#3c3c3c] transition-colors"
                    >
                        <FileCode className="w-4 h-4 text-[#89b4fa]" />
                        <span>Download as {ext}</span>
                    </button>
                    <div className="border-t border-[#3c3c3c]"></div>
                    <button
                        onClick={downloadAsPDF}
                        className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 text-[#cdd6f4] hover:bg-[#3c3c3c] transition-colors"
                    >
                        <FileText className="w-4 h-4 text-[#f38ba8]" />
                        <span>Download as PDF</span>
                    </button>
                </div>
            )}
        </div>
    );
}
