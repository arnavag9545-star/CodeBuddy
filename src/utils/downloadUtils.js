import JSZip from 'jszip';
import jsPDF from 'jspdf';

// Language color mapping for PDF
const LANGUAGE_COLORS = {
    python: [53, 114, 165],    // Python blue
    javascript: [247, 223, 30], // JS yellow
    cpp: [0, 89, 156],          // C++ blue
    java: [176, 114, 25],       // Java orange
    c: [85, 85, 85]             // C gray
};

/**
 * Download a single file
 */
export function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download multiple files as a ZIP
 */
export async function downloadAsZip(files, zipName) {
    if (!files || files.length === 0) return;

    // If single file, download directly
    if (files.length === 1) {
        downloadFile(files[0].filename, files[0].code);
        return;
    }

    const zip = new JSZip();

    files.forEach(file => {
        zip.file(file.filename, file.code || '');
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${zipName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download group as PDF with all files
 */
export function downloadGroupAsPDF(groupName, files) {
    if (!files || files.length === 0) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 15;
    const lineHeight = 5;
    const codeLineHeight = 4.5;
    let yPosition = 20;

    // Title Page
    pdf.setFillColor(30, 30, 30);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Group name
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(137, 180, 250); // Blue accent
    pdf.text(groupName, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });

    // File count
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(166, 173, 200);
    pdf.text(`${files.length} file${files.length !== 1 ? 's' : ''}`, pageWidth / 2, pageHeight / 2, { align: 'center' });

    // Timestamp
    pdf.setFontSize(10);
    pdf.setTextColor(108, 108, 108);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });

    // File list
    pdf.setFontSize(11);
    pdf.setTextColor(166, 173, 200);
    const fileListY = pageHeight / 2 + 50;
    files.forEach((file, i) => {
        if (fileListY + i * 6 < pageHeight - 20) {
            pdf.text(`• ${file.filename}`, margin + 20, fileListY + i * 6);
        }
    });

    // Add each file as separate page(s)
    files.forEach((file, fileIndex) => {
        pdf.addPage();
        yPosition = 20;

        // File header background
        pdf.setFillColor(37, 37, 38);
        pdf.rect(0, 0, pageWidth, 35, 'F');

        // File icon and name
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        const langColor = LANGUAGE_COLORS[file.language] || [137, 180, 250];
        pdf.setTextColor(...langColor);
        pdf.text(`📄 ${file.filename}`, margin, 22);

        // Language badge
        pdf.setFontSize(9);
        pdf.setTextColor(166, 173, 200);
        const langName = file.language?.charAt(0).toUpperCase() + file.language?.slice(1) || 'Text';
        pdf.text(langName.toUpperCase(), pageWidth - margin - 20, 22);

        yPosition = 45;

        // Code content
        pdf.setFontSize(9);
        pdf.setFont('courier', 'normal');

        const codeLines = (file.code || '').split('\n');

        codeLines.forEach((line, lineIndex) => {
            // Check if we need a new page
            if (yPosition > pageHeight - 15) {
                pdf.addPage();
                yPosition = 20;

                // Continue header on new page
                pdf.setFillColor(37, 37, 38);
                pdf.rect(0, 0, pageWidth, 25, 'F');
                pdf.setFontSize(10);
                pdf.setTextColor(166, 173, 200);
                pdf.text(`${file.filename} (continued)`, margin, 15);
                yPosition = 35;
            }

            // Line number
            const lineNum = String(lineIndex + 1).padStart(3, ' ');
            pdf.setTextColor(80, 80, 80);
            pdf.text(lineNum, margin, yPosition);

            // Code line (truncate if too long)
            pdf.setTextColor(212, 212, 212);
            const maxChars = 95;
            const displayLine = line.length > maxChars ? line.substring(0, maxChars) + '...' : line;
            pdf.text(displayLine || ' ', margin + 12, yPosition);

            yPosition += codeLineHeight;
        });
    });

    pdf.save(`${groupName}.pdf`);
}

/**
 * Download single file as PDF
 */
export function downloadSingleFileAsPDF(filename, code, language) {
    downloadGroupAsPDF(filename.split('.')[0], [{
        filename,
        code,
        language
    }]);
}
