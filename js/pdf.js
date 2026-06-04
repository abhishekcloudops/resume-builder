/* ═══════════════════════════════════════════════════════
   ResumeForge AI — PDF Generator
   Uses html2canvas + jsPDF for high-quality A4 output
   ═══════════════════════════════════════════════════════ */

const PDFGenerator = (() => {

  const A4_W_MM = 210;
  const A4_H_MM = 297;
  const SCALE = 2; // 2x resolution for crisp output

  /**
   * Show loading overlay
   */
  function showLoader() {
    const overlay = document.createElement('div');
    overlay.className = 'pdf-loading-overlay';
    overlay.id = 'pdfLoader';
    overlay.innerHTML = '<div class="spinner"></div><p>Generating PDF…</p>';
    document.body.appendChild(overlay);
  }

  /**
   * Remove loading overlay
   */
  function hideLoader() {
    const el = document.getElementById('pdfLoader');
    if (el) el.remove();
  }

  /**
   * Generate and download resume as PDF
   */
  async function downloadPDF() {
    const resumeEl = document.getElementById('resumePreview');
    if (!resumeEl) {
      alert('No resume preview found. Please fill in your details first.');
      return;
    }

    // Check if libraries are loaded
    if (typeof html2canvas === 'undefined') {
      alert('PDF library (html2canvas) failed to load. Please check your internet connection and refresh the page.');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF library (jsPDF) failed to load. Please check your internet connection and refresh the page.');
      return;
    }

    showLoader();

    try {
      // Temporarily reset any zoom transform
      const canvasWrap = document.getElementById('previewCanvasWrap');
      const prevTransform = canvasWrap ? canvasWrap.style.transform : '';
      if (canvasWrap) canvasWrap.style.transform = 'none';

      // Apply print formatting class for compact single-page layout
      resumeEl.classList.add('pdf-printing');

      // Ensure resume is at full width for capture
      const prevWidth = resumeEl.style.width;
      resumeEl.style.width = '794px';

      // Wait for fonts/images and reflow to finish
      await new Promise(r => setTimeout(r, 600));

      const canvas = await html2canvas(resumeEl, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794
      });

      // Restore class and styles
      resumeEl.classList.remove('pdf-printing');
      if (canvasWrap) canvasWrap.style.transform = prevTransform;
      resumeEl.style.width = prevWidth;

      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgW = canvas.width;
      const imgH = canvas.height;

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Scale the image proportionally to fit exactly on ONE A4 page
      const canvasRatio = imgW / imgH;
      const a4Ratio = A4_W_MM / A4_H_MM; // 210 / 297 = 0.707

      let printW = A4_W_MM;
      let printH = A4_H_MM;
      let xOffset = 0;
      let yOffset = 0;

      if (canvasRatio < a4Ratio) {
        // Canvas is taller than the A4 page ratio
        printH = A4_H_MM;
        printW = A4_H_MM * canvasRatio;
        xOffset = (A4_W_MM - printW) / 2;
      } else {
        // Canvas is wider than the A4 page ratio
        printW = A4_W_MM;
        printH = A4_W_MM / canvasRatio;
        yOffset = (A4_H_MM - printH) / 2;
      }

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, printW, printH, undefined, 'FAST');

      // Use person's name for the filename if available
      const nameEl = resumeEl.querySelector('h1');
      const name = nameEl ? nameEl.textContent.trim().replace(/\s+/g, '_') : 'resume';
      pdf.save(`${name}_Resume.pdf`);

    } catch (err) {
      console.error('PDF generation failed:', err);
      // Clean up in case of error
      resumeEl.classList.remove('pdf-printing');
      const canvasWrap = document.getElementById('previewCanvasWrap');
      if (canvasWrap) {
        canvasWrap.style.transform = '';
      }
      alert('PDF generation failed. Trying print dialog as fallback...');
      window.print();
    } finally {
      hideLoader();
    }
  }

  /**
   * Print the resume
   */
  function printResume() {
    window.print();
  }

  return { downloadPDF, printResume };
})();
