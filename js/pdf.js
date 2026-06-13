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
   * Generate and download resume as PDF (Text format via Print Dialog)
   */
  async function downloadPDF() {
    const resumeEl = document.getElementById('resumePreview');
    if (!resumeEl) {
      alert('No resume preview found. Please fill in your details first.');
      return;
    }
    
    alert('To download a readable text PDF (ATS-friendly), please select "Save as PDF" in the print dialog.');
    window.print();
  }

  /**
   * Print the resume
   */
  function printResume() {
    window.print();
  }

  // Ensure print formatting is applied when the print dialog is opened
  window.addEventListener('beforeprint', () => {
    const resumeEl = document.getElementById('resumePreview');
    if (resumeEl) {
      resumeEl.classList.add('pdf-printing');
    }
  });

  window.addEventListener('afterprint', () => {
    const resumeEl = document.getElementById('resumePreview');
    if (resumeEl) {
      resumeEl.classList.remove('pdf-printing');
    }
  });

  return { downloadPDF, printResume };
})();
