/* ═══════════════════════════════════════════════════════
   ResumeForge AI — Main Application
   Core logic: forms, live preview, ATS, undo/redo,
   drag-and-drop, auto-save, etc.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────
     STATE
     ───────────────────────────────────────────────────── */
  let resumeData = StorageManager.loadData();
  let currentTemplate = StorageManager.loadTemplate();
  let zoomLevel = 100;

  // Undo / Redo stacks
  const undoStack = [];
  const redoStack = [];
  const MAX_UNDO = 40;

  // Auto-save debounce
  let autoSaveTimer = null;
  const AUTO_SAVE_DELAY = 1500;

  /* ─────────────────────────────────────────────────────
     DOM REFS
     ───────────────────────────────────────────────────── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const resumePreview = $('#resumePreview');
  const sidebarInner = $('#sidebarInner');

  /* ─────────────────────────────────────────────────────
     INIT
     ───────────────────────────────────────────────────── */
  function init() {
    applyTheme(StorageManager.loadTheme());
    populateFormFromData();
    updatePreview();
    updateATS();
    updateProgress();
    initSectionCollapse();
    initSidebarToggle();
    initTemplateGallery();
    initZoomControls();
    initSortable();
    restoreSectionOrder();
    bindHeaderButtons();
    bindFormEvents();
    bindPhotoUpload();
    bindSkillsInput();

    // SaaS additions
    initSidebarTabs();
    initSidebarToolbar();
    initOnboarding();
    initAtsModal();
    initAiAutofillModal();

    // Set initial doc title value
    const docTitleInput = $('#docTitle');
    if (docTitleInput) {
      docTitleInput.value = resumeData.documentTitle || 'My Resume';
      docTitleInput.addEventListener('input', () => {
        resumeData.documentTitle = docTitleInput.value.trim() || 'My Resume';
        onDataChange();
      });
    }

    pushUndoState(); // initial state
  }

  document.addEventListener('DOMContentLoaded', init);


  /* ─────────────────────────────────────────────────────
     THEME
     ───────────────────────────────────────────────────── */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    StorageManager.saveTheme(theme);
    const icon = $('#themeToggle i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }


  /* ─────────────────────────────────────────────────────
     LIVE PREVIEW
     ───────────────────────────────────────────────────── */
  function updatePreview() {
    if (!resumePreview) return;
    resumePreview.innerHTML = TemplateEngine.render(currentTemplate, resumeData);
    autoFitPreview();
  }


  /* ─────────────────────────────────────────────────────
     ATS SCORE CALCULATOR
     ───────────────────────────────────────────────────── */
  function calculateATS() {
    let score = 0;
    const p = resumeData.personal;

    // Contact info (20 pts)
    if (p.fullName) score += 5;
    if (p.email) score += 5;
    if (p.phone) score += 5;
    if (p.address) score += 3;
    if (p.linkedin) score += 2;

    // Summary (15 pts)
    if (resumeData.summary) {
      score += 5;
      if (resumeData.summary.length > 80) score += 5;
      if (resumeData.summary.length > 200) score += 5;
    }

    // Skills (15 pts)
    const skillCount = resumeData.skills.length;
    if (skillCount >= 1) score += 3;
    if (skillCount >= 3) score += 4;
    if (skillCount >= 5) score += 4;
    if (skillCount >= 8) score += 4;

    // Experience (25 pts)
    const expCount = resumeData.experience.length;
    if (expCount >= 1) score += 8;
    if (expCount >= 2) score += 7;
    if (expCount >= 3) score += 5;
    // Responsibilities detail
    const hasDetailedResp = resumeData.experience.some(e => e.responsibilities && e.responsibilities.length > 50);
    if (hasDetailedResp) score += 5;

    // Education (10 pts)
    if (resumeData.education.length >= 1) score += 7;
    if (resumeData.education.length >= 2) score += 3;

    // Projects (5 pts)
    if (resumeData.projects.length >= 1) score += 3;
    if (resumeData.projects.length >= 2) score += 2;

    // Certifications (5 pts)
    if (resumeData.certifications.length >= 1) score += 3;
    if (resumeData.certifications.length >= 2) score += 2;

    // Languages (5 pts)
    if (resumeData.languages.length >= 1) score += 5;

    return Math.min(100, score);
  }

  function updateATS() {
    const score = calculateATS();
    
    // Update desktop
    const ring = $('#atsRingFg');
    const value = $('#atsValue');
    if (ring) ring.setAttribute('stroke-dasharray', `${score}, 100`);
    if (value) value.textContent = score;

    // Update mobile preview toolbar badge
    const ringMobile = $('#atsRingFgMobile');
    const valueMobile = $('#atsValueMobile');
    if (ringMobile) ringMobile.setAttribute('stroke-dasharray', `${score}, 100`);
    if (valueMobile) valueMobile.textContent = score;

    // Update modal ring
    const ringModal = $('#atsRingFgModalAts');
    const valueModal = $('#atsValueModalAts');
    if (ringModal) ringModal.setAttribute('stroke-dasharray', `${score}, 100`);
    if (valueModal) valueModal.textContent = score;

    // Color by score
    let color = '#ef4444';
    if (score >= 70) color = '#10B981';
    else if (score >= 40) color = '#f59e0b';
    
    if (ring) ring.style.stroke = color;
    if (ringMobile) ringMobile.style.stroke = color;
    if (ringModal) ringModal.style.stroke = color;

    // Modal Label
    const scoreLabel = $('#atsScoreLabel');
    if (scoreLabel) {
      if (score >= 70) {
        scoreLabel.innerHTML = 'ATS Score: <span style="color:#10B981">Excellent</span>';
      } else if (score >= 40) {
        scoreLabel.innerHTML = 'ATS Score: <span style="color:#f59e0b">Good</span>';
      } else {
        scoreLabel.innerHTML = 'ATS Score: <span style="color:#ef4444">Needs Improvement</span>';
      }
    }
  }

  /* ─────────────────────────────────────────────────────
     ATS MODAL CHECKLIST RENDERING & ACTIONS
     ───────────────────────────────────────────────────── */
  function initAtsModal() {
    const modal = $('#atsModal');
    const closeBtn = $('#closeAtsModal');
    const openBtn = $('#atsBadge');
    const openBtnMobile = $('#atsBadgeMobile');

    if (!modal) return;

    const openModal = () => {
      renderATSChecklist();
      modal.classList.add('active');
    };

    openBtn?.addEventListener('click', openModal);
    openBtnMobile?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  function renderATSChecklist() {
    const container = $('#atsChecklist');
    if (!container) return;

    const checklist = [];
    const p = resumeData.personal;

    // Contact info checks
    if (!p.fullName) {
      checklist.push({
        status: 'danger',
        title: 'Full Name is missing',
        tip: 'Recruiters need to know who you are. Add your full name.',
        tab: 'personal',
        focus: 'fullName'
      });
    } else {
      checklist.push({
        status: 'success',
        title: 'Full Name provided',
        tip: 'Great! Your name is clearly stated.'
      });
    }

    if (!p.email) {
      checklist.push({
        status: 'danger',
        title: 'Email address is missing',
        tip: 'Add a professional email address (e.g. john.doe@example.com).',
        tab: 'personal',
        focus: 'email'
      });
    } else {
      checklist.push({
        status: 'success',
        title: 'Email address provided',
        tip: 'Recruiters can easily contact you.'
      });
    }

    if (!p.phone) {
      checklist.push({
        status: 'warning',
        title: 'Phone number is missing',
        tip: 'Consider adding your phone number for quick screening calls.',
        tab: 'personal',
        focus: 'phone'
      });
    }

    if (!p.linkedin) {
      checklist.push({
        status: 'warning',
        title: 'LinkedIn profile is missing',
        tip: '90%+ of recruiters search candidates on LinkedIn. Add your profile link.',
        tab: 'personal',
        focus: 'linkedin'
      });
    } else {
      checklist.push({
        status: 'success',
        title: 'LinkedIn profile linked',
        tip: 'Good job keeping your online presence professional.'
      });
    }

    // Summary checks
    if (!resumeData.summary) {
      checklist.push({
        status: 'warning',
        title: 'Professional Summary is missing',
        tip: 'A short profile summary helps hook hiring managers in 6 seconds.',
        tab: 'summary',
        focus: 'summary'
      });
    } else if (resumeData.summary.length < 80) {
      checklist.push({
        status: 'warning',
        title: 'Summary is too short',
        tip: 'Write at least 80 characters describing your skills and career goals.',
        tab: 'summary',
        focus: 'summary'
      });
    } else if (resumeData.summary.length > 400) {
      checklist.push({
        status: 'warning',
        title: 'Summary is too long',
        tip: 'Keep your summary concise (under 400 chars) so it fits on one page.',
        tab: 'summary',
        focus: 'summary'
      });
    } else {
      checklist.push({
        status: 'success',
        title: 'Professional Summary is optimized',
        tip: 'Your summary provides a concise overview of your profile.'
      });
    }

    // Work experience checks
    const expCount = resumeData.experience.length;
    if (expCount === 0) {
      checklist.push({
        status: 'danger',
        title: 'No Work Experience listed',
        tip: 'Work history is the most critical part of an ATS scan. Add at least one entry.',
        tab: 'experience',
        focus: 'fullName' // Focus fullName in personal as generic input focus
      });
    } else if (expCount < 2) {
      checklist.push({
        status: 'warning',
        title: 'Only 1 Work Experience entry',
        tip: 'Consider adding more experience entries if you have prior work history.',
        tab: 'experience',
        focus: 'fullName'
      });
    } else {
      checklist.push({
        status: 'success',
        title: `Work History is detailed (${expCount} entries)`,
        tip: 'Great depth of work history to showcase.'
      });
    }

    // Skills checks
    const skillCount = resumeData.skills.length;
    if (skillCount === 0) {
      checklist.push({
        status: 'danger',
        title: 'No Skills listed',
        tip: 'ATS matches candidate resumes by keyword. List at least 5 skills.',
        tab: 'skills',
        focus: 'skillInput'
      });
    } else if (skillCount < 5) {
      checklist.push({
        status: 'warning',
        title: `Only ${skillCount} skills listed`,
        tip: 'Include at least 5 key industry skills to match common job description keywords.',
        tab: 'skills',
        focus: 'skillInput'
      });
    } else {
      checklist.push({
        status: 'success',
        title: `${skillCount} skills keywords added`,
        tip: 'Excellent! Your resume has good keyword density.'
      });
    }

    // Education checks
    if (resumeData.education.length === 0) {
      checklist.push({
        status: 'warning',
        title: 'No Education listed',
        tip: 'Many positions require formal degrees or courses. Add your education history.',
        tab: 'education',
        focus: 'fullName'
      });
    } else {
      checklist.push({
        status: 'success',
        title: 'Education history provided',
        tip: 'Academic background is clearly detailed.'
      });
    }

    // Render HTML
    container.innerHTML = checklist.map(item => {
      const icon = item.status === 'success' ? 'fa-circle-check' : (item.status === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-xmark');
      return `
        <div class="ats-check-item ${item.status}">
          <i class="ats-check-icon ${item.status} fas ${icon}"></i>
          <div class="ats-check-details">
            <span class="ats-check-title">${item.title}</span>
            <span class="ats-check-tip">${item.tip}</span>
            ${item.status !== 'success' && item.tab ? `
              <button class="ats-btn-fix" data-tab="${item.tab}" data-focus="${item.focus}">
                <i class="fas fa-wrench"></i> Fix It
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Bind click events on Fix It buttons
    container.querySelectorAll('.ats-btn-fix').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        const focusId = btn.getAttribute('data-focus');

        // Close modal
        $('#atsModal').classList.remove('active');

        // Click sidebar tab
        const tabEl = $(`.sidebar-tab[data-tab="${tabName}"]`);
        if (tabEl) tabEl.click();

        // Focus input
        setTimeout(() => {
          const targetInput = document.getElementById(focusId);
          if (targetInput) {
            targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetInput.focus();
            targetInput.classList.add('highlight-glow');
            setTimeout(() => targetInput.classList.remove('highlight-glow'), 2200);
          }
        }, 300);
      });
    });
  }


  /* ─────────────────────────────────────────────────────
     PROGRESS INDICATOR
     ───────────────────────────────────────────────────── */
  function updateProgress() {
    let filled = 0;
    let total = 8;
    const p = resumeData.personal;
    if (p.fullName) filled++;
    if (p.email || p.phone) filled++;
    if (resumeData.summary) filled++;
    if (resumeData.skills.length) filled++;
    if (resumeData.experience.length) filled++;
    if (resumeData.education.length) filled++;
    if (resumeData.projects.length) filled++;
    if (resumeData.certifications.length || resumeData.languages.length) filled++;

    const pct = Math.round((filled / total) * 100);
    const bar = $('#progressBar');
    if (bar) bar.style.width = pct + '%';
  }


  /* ─────────────────────────────────────────────────────
     SECTION COLLAPSE
     ───────────────────────────────────────────────────── */
  function initSectionCollapse() {
    $$('.section-header').forEach(header => {
      header.addEventListener('click', () => {
        const targetId = header.getAttribute('data-toggle');
        const body = document.getElementById(targetId);
        if (body) {
          body.classList.toggle('collapsed');
          header.classList.toggle('collapsed');
        }
      });
    });
  }


  /* ─────────────────────────────────────────────────────
     SIDEBAR MOBILE TOGGLE
     ───────────────────────────────────────────────────── */
  function initSidebarToggle() {
    const sidebar = $('#sidebar');
    const toggle = $('#sidebarToggle');
    const overlay = $('#sidebarOverlay');
    const closeBtn = $('#closeSidebar');

    if (toggle) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });
    }
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  }


  /* ─────────────────────────────────────────────────────
     TEMPLATE GALLERY
     ───────────────────────────────────────────────────── */
  function initTemplateGallery() {
    const modal = $('#templateModal');
    const grid = $('#templateGrid');
    const btnOpen = $('#btnTemplateGallery');
    const btnClose = $('#closeTemplateModal');

    // Render template cards
    const templates = TemplateEngine.getTemplates();
    grid.innerHTML = templates.map(t => `
      <div class="template-card ${t.id === currentTemplate ? 'active' : ''}" data-template="${t.id}">
        <div class="template-card-thumb">
          <div class="mini-resume" id="mini-${t.id}"></div>
        </div>
        <div class="template-card-info">
          <h4><i class="fas ${t.icon}" style="color:${t.color}"></i> ${t.name}</h4>
          <p>${t.description}</p>
        </div>
      </div>
    `).join('');

    // Render mini previews
    templates.forEach(t => {
      const mini = document.getElementById(`mini-${t.id}`);
      if (mini) {
        mini.innerHTML = TemplateEngine.render(t.id, resumeData);
      }
    });

    // Open/Close
    const openGallery = () => {
      modal.classList.add('active');
      // Refresh mini previews
      templates.forEach(t => {
        const mini = document.getElementById(`mini-${t.id}`);
        if (mini) mini.innerHTML = TemplateEngine.render(t.id, resumeData);
      });
    };
    btnOpen.addEventListener('click', openGallery);
    $('#btnTemplateGalleryMobile')?.addEventListener('click', openGallery);

    btnClose.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    // Select template
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.template-card');
      if (!card) return;
      const id = card.getAttribute('data-template');
      currentTemplate = id;
      StorageManager.saveTemplate(id);
      // Update active state
      grid.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      updatePreview();
      modal.classList.remove('active');
    });
  }


  /* ─────────────────────────────────────────────────────
     ZOOM CONTROLS
     ───────────────────────────────────────────────────── */
  function autoFitPreview() {
    const scrollEl = $('#previewScroll');
    const resumeEl = $('#resumePreview');
    const wrapEl = $('#previewCanvasWrap');
    if (!scrollEl || !resumeEl || !wrapEl) return;

    if (window.innerWidth < 1200) {
      const containerWidth = scrollEl.clientWidth - 32;
      const resumeWidth = 794;
      const scale = Math.min(1, containerWidth / resumeWidth);
      
      wrapEl.style.transform = `scale(${scale})`;
      wrapEl.style.transformOrigin = 'top center';
      wrapEl.style.width = '794px';
      
      const scaledHeight = resumeEl.offsetHeight * scale;
      wrapEl.style.height = scaledHeight + 'px';
      
      const zoomValEl = $('#zoomValue');
      if (zoomValEl) {
        zoomValEl.textContent = Math.round(scale * 100) + '%';
      }
    } else {
      wrapEl.style.transform = `scale(${zoomLevel / 100})`;
      wrapEl.style.transformOrigin = 'top center';
      wrapEl.style.width = '794px';
      wrapEl.style.height = 'auto';
      
      const zoomValEl = $('#zoomValue');
      if (zoomValEl) {
        zoomValEl.textContent = zoomLevel + '%';
      }
    }
  }

  function initZoomControls() {
    const wrap = $('#previewCanvasWrap');
    const zoomValEl = $('#zoomValue');

    function applyZoom() {
      if (window.innerWidth < 1200) {
        autoFitPreview();
      } else {
        if (wrap) wrap.style.transform = `scale(${zoomLevel / 100})`;
        if (wrap) wrap.style.transformOrigin = 'top center';
        if (wrap) wrap.style.height = 'auto';
        if (zoomValEl) zoomValEl.textContent = zoomLevel + '%';
      }
    }

    $('#zoomIn')?.addEventListener('click', () => {
      zoomLevel = Math.min(150, zoomLevel + 10);
      applyZoom();
    });
    $('#zoomOut')?.addEventListener('click', () => {
      zoomLevel = Math.max(50, zoomLevel - 10);
      applyZoom();
    });
    $('#zoomFit')?.addEventListener('click', () => {
      zoomLevel = 100;
      applyZoom();
    });

    window.addEventListener('resize', autoFitPreview);
  }


  /* ─────────────────────────────────────────────────────
     DRAG & DROP SECTION ORDERING (SortableJS)
     ───────────────────────────────────────────────────── */
  function initSortable() {
    if (typeof Sortable === 'undefined') return;
    Sortable.create(sidebarInner, {
      animation: 200,
      handle: '.section-header',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: () => {
        const order = Array.from(sidebarInner.children).map(el => el.getAttribute('data-section')).filter(Boolean);
        StorageManager.saveSectionOrder(order);
      }
    });
  }

  function restoreSectionOrder() {
    const order = StorageManager.loadSectionOrder();
    if (!order) return;
    order.forEach(sectionKey => {
      const el = sidebarInner.querySelector(`[data-section="${sectionKey}"]`);
      if (el) sidebarInner.appendChild(el);
    });
  }


  /* ─────────────────────────────────────────────────────
     HEADER BUTTONS
     ───────────────────────────────────────────────────── */
  function bindHeaderButtons() {
    // Theme toggle
    $('#themeToggle')?.addEventListener('click', toggleTheme);

    // Save
    $('#btnSave')?.addEventListener('click', () => {
      StorageManager.saveData(resumeData);
      showToast();
    });

    // Download PDF
    $('#btnDownloadPDF')?.addEventListener('click', () => PDFGenerator.downloadPDF());

    // Print
    $('#btnPrint')?.addEventListener('click', () => PDFGenerator.printResume());

    // Undo / Redo
    $('#btnUndo')?.addEventListener('click', undo);
    $('#btnRedo')?.addEventListener('click', redo);

    // Mobile action proxies
    $('#btnUndoMobile')?.addEventListener('click', () => $('#btnUndo')?.click());
    $('#btnRedoMobile')?.addEventListener('click', () => $('#btnRedo')?.click());
    $('#btnImportJSONMobile')?.addEventListener('click', () => $('#btnImportJSON')?.click());
    $('#btnExportJSONMobile')?.addEventListener('click', () => $('#btnExportJSON')?.click());
    $('#btnPrintMobile')?.addEventListener('click', () => $('#btnPrint')?.click());

    // Export JSON
    $('#btnExportJSON')?.addEventListener('click', () => {
      const json = StorageManager.exportJSON(resumeData, currentTemplate);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume-data.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import JSON
    $('#btnImportJSON')?.addEventListener('click', () => {
      $('#importModal').classList.add('active');
    });
    $('#closeImportModal')?.addEventListener('click', () => {
      $('#importModal').classList.remove('active');
    });
    $('#importModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'importModal') e.target.classList.remove('active');
    });

    // Import file input
    $('#importFileInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        $('#importTextarea').value = ev.target.result;
      };
      reader.readAsText(file);
    });

    // Do import
    $('#btnDoImport')?.addEventListener('click', () => {
      const text = $('#importTextarea')?.value;
      if (!text) return;
      try {
        const result = StorageManager.importJSON(text);
        resumeData = { ...StorageManager.getDefaults(), ...result.data };
        currentTemplate = result.template;
        StorageManager.saveData(resumeData);
        StorageManager.saveTemplate(currentTemplate);
        populateFormFromData();
        updatePreview();
        updateATS();
        updateProgress();
        pushUndoState();
        $('#importModal').classList.remove('active');
        showToast();
      } catch (err) {
        alert(err.message);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        StorageManager.saveData(resumeData);
        showToast();
      }
    });
  }


  /* ─────────────────────────────────────────────────────
     FORM EVENTS — Live Preview Binding
     ───────────────────────────────────────────────────── */
  function bindFormEvents() {
    // Personal info fields
    const personalFields = ['fullName', 'jobTitle', 'email', 'phone', 'address', 'website', 'linkedin', 'github'];
    personalFields.forEach(field => {
      const el = document.getElementById(field);
      if (el) {
        el.addEventListener('input', () => {
          resumeData.personal[field] = el.value;
          onDataChange();
        });
      }
    });

    // Summary
    const summaryEl = $('#summary');
    if (summaryEl) {
      summaryEl.addEventListener('input', () => {
        resumeData.summary = summaryEl.value;
        onDataChange();
      });
    }

    // Add entry buttons
    $('#btnAddExperience')?.addEventListener('click', () => addExperience());
    $('#btnAddEducation')?.addEventListener('click', () => addEducation());
    $('#btnAddProject')?.addEventListener('click', () => addProject());
    $('#btnAddCert')?.addEventListener('click', () => addCertification());
    $('#btnAddLang')?.addEventListener('click', () => addLanguage());
    $('#btnAddSocial')?.addEventListener('click', () => addSocialLink());
  }


  /* ─────────────────────────────────────────────────────
     PHOTO UPLOAD
     ───────────────────────────────────────────────────── */
  function bindPhotoUpload() {
    const input = $('#photoUpload');
    const preview = $('#photoPreview');
    const removeBtn = $('#removePhoto');

    input?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        resumeData.personal.photo = ev.target.result;
        renderPhotoPreview();
        onDataChange();
      };
      reader.readAsDataURL(file);
    });

    removeBtn?.addEventListener('click', () => {
      resumeData.personal.photo = '';
      renderPhotoPreview();
      onDataChange();
    });

    renderPhotoPreview();
  }

  function renderPhotoPreview() {
    const preview = $('#photoPreview');
    const removeBtn = $('#removePhoto');
    if (resumeData.personal.photo) {
      preview.innerHTML = `<img src="${resumeData.personal.photo}" alt="Photo" />`;
      preview.classList.add('has-photo');
      if (removeBtn) removeBtn.style.display = 'inline-flex';
    } else {
      preview.innerHTML = '<i class="fas fa-camera"></i><span>Upload Photo</span>';
      preview.classList.remove('has-photo');
      if (removeBtn) removeBtn.style.display = 'none';
    }
  }


  /* ─────────────────────────────────────────────────────
     SKILLS INPUT
     ───────────────────────────────────────────────────── */
  function bindSkillsInput() {
    const input = $('#skillInput');
    const btn = $('#btnAddSkill');

    function addSkill() {
      const val = input.value.trim();
      if (!val) return;
      if (!resumeData.skills.includes(val)) {
        resumeData.skills.push(val);
        renderSkillTags();
        onDataChange();
      }
      input.value = '';
      input.focus();
    }

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
      }
    });
    btn?.addEventListener('click', addSkill);

    renderSkillTags();
  }

  function renderSkillTags() {
    const container = $('#skillsTags');
    if (!container) return;
    container.innerHTML = resumeData.skills.map((skill, i) => `
      <span class="skill-tag">
        ${escapeHTML(skill)}
        <button class="remove-skill" data-index="${i}" title="Remove"><i class="fas fa-xmark"></i></button>
      </span>
    `).join('');

    container.querySelectorAll('.remove-skill').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        resumeData.skills.splice(idx, 1);
        renderSkillTags();
        onDataChange();
      });
    });
  }


  /* ─────────────────────────────────────────────────────
     EXPERIENCE ENTRIES
     ───────────────────────────────────────────────────── */
  function addExperience(data) {
    const entry = data || { position: '', company: '', location: '', startDate: '', endDate: '', responsibilities: '' };
    if (!data) {
      resumeData.experience.push(entry);
      pushUndoState();
    }
    renderExperienceEntry(resumeData.experience.length - 1);
    onDataChange();
  }

  function renderExperienceEntry(index) {
    const container = $('#experienceEntries');
    const entry = resumeData.experience[index];
    if (!entry) return;

    const card = document.createElement('div');
    card.className = 'entry-card';
    card.setAttribute('data-index', index);
    card.innerHTML = `
      <div class="entry-header">
        <span class="entry-title">Experience #${index + 1}</span>
        <button class="btn-remove-entry" data-type="experience" data-index="${index}"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Position</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.position)}" data-type="experience" data-index="${index}" data-field="position" placeholder="Software Engineer" />
        </div>
        <div class="form-group">
          <label>Company</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.company)}" data-type="experience" data-index="${index}" data-field="company" placeholder="Google" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Location</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.location)}" data-type="experience" data-index="${index}" data-field="location" placeholder="Mountain View, CA" />
        </div>
        <div class="form-group">
          <label>Start Date</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.startDate)}" data-type="experience" data-index="${index}" data-field="startDate" placeholder="Jan 2020" />
        </div>
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="text" class="glass-input" value="${escapeHTML(entry.endDate)}" data-type="experience" data-index="${index}" data-field="endDate" placeholder="Present" />
      </div>
      <div class="form-group">
        <label>Responsibilities (one per line)</label>
        <textarea class="glass-input" rows="3" data-type="experience" data-index="${index}" data-field="responsibilities" placeholder="Led a team of 5 engineers...">${escapeHTML(entry.responsibilities)}</textarea>
      </div>
    `;

    container.appendChild(card);
    bindEntryEvents(card);
  }

  function renderAllExperience() {
    const container = $('#experienceEntries');
    if (container) container.innerHTML = '';
    resumeData.experience.forEach((_, i) => renderExperienceEntry(i));
  }


  /* ─────────────────────────────────────────────────────
     EDUCATION ENTRIES
     ───────────────────────────────────────────────────── */
  function addEducation(data) {
    const entry = data || { degree: '', school: '', startYear: '', endYear: '', description: '' };
    if (!data) {
      resumeData.education.push(entry);
      pushUndoState();
    }
    renderEducationEntry(resumeData.education.length - 1);
    onDataChange();
  }

  function renderEducationEntry(index) {
    const container = $('#educationEntries');
    const entry = resumeData.education[index];
    if (!entry) return;

    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="entry-header">
        <span class="entry-title">Education #${index + 1}</span>
        <button class="btn-remove-entry" data-type="education" data-index="${index}"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Degree</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.degree)}" data-type="education" data-index="${index}" data-field="degree" placeholder="B.S. Computer Science" />
        </div>
        <div class="form-group">
          <label>School</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.school)}" data-type="education" data-index="${index}" data-field="school" placeholder="MIT" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Start Year</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.startYear)}" data-type="education" data-index="${index}" data-field="startYear" placeholder="2016" />
        </div>
        <div class="form-group">
          <label>End Year</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.endYear)}" data-type="education" data-index="${index}" data-field="endYear" placeholder="2020" />
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="glass-input" rows="2" data-type="education" data-index="${index}" data-field="description" placeholder="GPA 3.9, Dean's List...">${escapeHTML(entry.description)}</textarea>
      </div>
    `;

    container.appendChild(card);
    bindEntryEvents(card);
  }

  function renderAllEducation() {
    const container = $('#educationEntries');
    if (container) container.innerHTML = '';
    resumeData.education.forEach((_, i) => renderEducationEntry(i));
  }


  /* ─────────────────────────────────────────────────────
     PROJECT ENTRIES
     ───────────────────────────────────────────────────── */
  function addProject(data) {
    const entry = data || { name: '', description: '', techStack: '', link: '' };
    if (!data) {
      resumeData.projects.push(entry);
      pushUndoState();
    }
    renderProjectEntry(resumeData.projects.length - 1);
    onDataChange();
  }

  function renderProjectEntry(index) {
    const container = $('#projectEntries');
    const entry = resumeData.projects[index];
    if (!entry) return;

    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="entry-header">
        <span class="entry-title">Project #${index + 1}</span>
        <button class="btn-remove-entry" data-type="projects" data-index="${index}"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Project Name</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.name)}" data-type="projects" data-index="${index}" data-field="name" placeholder="E-Commerce Platform" />
        </div>
        <div class="form-group">
          <label>Link</label>
          <input type="url" class="glass-input" value="${escapeHTML(entry.link)}" data-type="projects" data-index="${index}" data-field="link" placeholder="https://github.com/..." />
        </div>
      </div>
      <div class="form-group">
        <label>Tech Stack</label>
        <input type="text" class="glass-input" value="${escapeHTML(entry.techStack)}" data-type="projects" data-index="${index}" data-field="techStack" placeholder="React, Node.js, MongoDB" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="glass-input" rows="2" data-type="projects" data-index="${index}" data-field="description" placeholder="Built a full-stack...">${escapeHTML(entry.description)}</textarea>
      </div>
    `;

    container.appendChild(card);
    bindEntryEvents(card);
  }

  function renderAllProjects() {
    const container = $('#projectEntries');
    if (container) container.innerHTML = '';
    resumeData.projects.forEach((_, i) => renderProjectEntry(i));
  }


  /* ─────────────────────────────────────────────────────
     CERTIFICATION ENTRIES
     ───────────────────────────────────────────────────── */
  function addCertification(data) {
    const entry = data || { name: '' };
    if (!data) {
      resumeData.certifications.push(entry);
      pushUndoState();
    }
    renderCertEntry(resumeData.certifications.length - 1);
    onDataChange();
  }

  function renderCertEntry(index) {
    const container = $('#certEntries');
    const entry = resumeData.certifications[index];
    if (!entry) return;

    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="entry-header">
        <span class="entry-title">Certification #${index + 1}</span>
        <button class="btn-remove-entry" data-type="certifications" data-index="${index}"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label>Certification Name</label>
        <input type="text" class="glass-input" value="${escapeHTML(entry.name)}" data-type="certifications" data-index="${index}" data-field="name" placeholder="AWS Solutions Architect" />
      </div>
    `;

    container.appendChild(card);
    bindEntryEvents(card);
  }

  function renderAllCerts() {
    const container = $('#certEntries');
    if (container) container.innerHTML = '';
    resumeData.certifications.forEach((_, i) => renderCertEntry(i));
  }


  /* ─────────────────────────────────────────────────────
     LANGUAGE ENTRIES
     ───────────────────────────────────────────────────── */
  function addLanguage(data) {
    const entry = data || { name: '', level: '' };
    if (!data) {
      resumeData.languages.push(entry);
      pushUndoState();
    }
    renderLangEntry(resumeData.languages.length - 1);
    onDataChange();
  }

  function renderLangEntry(index) {
    const container = $('#langEntries');
    const entry = resumeData.languages[index];
    if (!entry) return;

    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="entry-header">
        <span class="entry-title">Language #${index + 1}</span>
        <button class="btn-remove-entry" data-type="languages" data-index="${index}"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-row">
        <div class="form-group" style="margin-bottom:0">
          <label>Language</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.name)}" data-type="languages" data-index="${index}" data-field="name" placeholder="English" />
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>Level</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.level)}" data-type="languages" data-index="${index}" data-field="level" placeholder="Native / Fluent" />
        </div>
      </div>
    `;

    container.appendChild(card);
    bindEntryEvents(card);
  }

  function renderAllLangs() {
    const container = $('#langEntries');
    if (container) container.innerHTML = '';
    resumeData.languages.forEach((_, i) => renderLangEntry(i));
  }


  /* ─────────────────────────────────────────────────────
     SOCIAL LINK ENTRIES
     ───────────────────────────────────────────────────── */
  function addSocialLink(data) {
    const entry = data || { platform: '', url: '' };
    if (!data) {
      resumeData.social.push(entry);
      pushUndoState();
    }
    renderSocialEntry(resumeData.social.length - 1);
    onDataChange();
  }

  function renderSocialEntry(index) {
    const container = $('#socialEntries');
    const entry = resumeData.social[index];
    if (!entry) return;

    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="entry-header">
        <span class="entry-title">Link #${index + 1}</span>
        <button class="btn-remove-entry" data-type="social" data-index="${index}"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-row">
        <div class="form-group" style="margin-bottom:0">
          <label>Platform</label>
          <input type="text" class="glass-input" value="${escapeHTML(entry.platform)}" data-type="social" data-index="${index}" data-field="platform" placeholder="Twitter" />
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>URL</label>
          <input type="url" class="glass-input" value="${escapeHTML(entry.url)}" data-type="social" data-index="${index}" data-field="url" placeholder="https://twitter.com/..." />
        </div>
      </div>
    `;

    container.appendChild(card);
    bindEntryEvents(card);
  }

  function renderAllSocial() {
    const container = $('#socialEntries');
    if (container) container.innerHTML = '';
    resumeData.social.forEach((_, i) => renderSocialEntry(i));
  }


  /* ─────────────────────────────────────────────────────
     ENTRY EVENT BINDING
     ───────────────────────────────────────────────────── */
  function bindEntryEvents(card) {
    // Input/textarea changes
    card.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', () => {
        const type = el.getAttribute('data-type');
        const index = parseInt(el.getAttribute('data-index'));
        const field = el.getAttribute('data-field');
        if (type && !isNaN(index) && field && resumeData[type] && resumeData[type][index]) {
          resumeData[type][index][field] = el.value;
          onDataChange();
        }
      });
    });

    // Remove button
    card.querySelectorAll('.btn-remove-entry').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const index = parseInt(btn.getAttribute('data-index'));
        if (type && !isNaN(index) && resumeData[type]) {
          resumeData[type].splice(index, 1);
          reRenderSection(type);
          onDataChange();
          pushUndoState();
        }
      });
    });
  }

  function reRenderSection(type) {
    switch (type) {
      case 'experience': renderAllExperience(); break;
      case 'education': renderAllEducation(); break;
      case 'projects': renderAllProjects(); break;
      case 'certifications': renderAllCerts(); break;
      case 'languages': renderAllLangs(); break;
      case 'social': renderAllSocial(); break;
    }
  }


  /* ─────────────────────────────────────────────────────
     POPULATE FORM FROM DATA (Restore)
     ───────────────────────────────────────────────────── */
  function populateFormFromData() {
    // Document title
    const docTitleInput = $('#docTitle');
    if (docTitleInput) docTitleInput.value = resumeData.documentTitle || 'My Resume';

    // Personal fields
    const personalFields = ['fullName', 'jobTitle', 'email', 'phone', 'address', 'website', 'linkedin', 'github'];
    personalFields.forEach(field => {
      const el = document.getElementById(field);
      if (el) el.value = resumeData.personal[field] || '';
    });

    // Summary
    const summaryEl = $('#summary');
    if (summaryEl) summaryEl.value = resumeData.summary || '';

    // Photo
    renderPhotoPreview();

    // Skills
    renderSkillTags();

    // Dynamic entries
    renderAllExperience();
    renderAllEducation();
    renderAllProjects();
    renderAllCerts();
    renderAllLangs();
    renderAllSocial();
  }


  /* ─────────────────────────────────────────────────────
     DATA CHANGE HANDLER
     ───────────────────────────────────────────────────── */
  function onDataChange() {
    updatePreview();
    updateATS();
    updateProgress();
    scheduleAutoSave();
  }


  /* ─────────────────────────────────────────────────────
     AUTO-SAVE
     ───────────────────────────────────────────────────── */
  function updateCloudStatus(status) {
    const el = $('#cloudSaveStatus');
    if (!el) return;
    if (status === 'saving') {
      el.classList.add('saving');
      const span = el.querySelector('span');
      if (span) span.textContent = 'Saving...';
      const icon = el.querySelector('i');
      if (icon) icon.className = 'fas fa-sync';
    } else {
      el.classList.remove('saving');
      const span = el.querySelector('span');
      if (span) span.textContent = 'Saved';
      const icon = el.querySelector('i');
      if (icon) icon.className = 'fas fa-cloud';
    }
  }

  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    updateCloudStatus('saving');
    autoSaveTimer = setTimeout(() => {
      StorageManager.saveData(resumeData);
      pushUndoState();
      updateCloudStatus('saved');
      showToast();
    }, AUTO_SAVE_DELAY);
  }

  function showToast() {
    const toast = $('#autosaveToast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  /* ─────────────────────────────────────────────────────
     SAAS TABS & ONBOARDING / TOOLBAR LOGIC
     ───────────────────────────────────────────────────── */
  function initSidebarTabs() {
    const tabs = $$('.sidebar-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const activeTab = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show/hide sections
        $$('.form-section').forEach(sec => {
          const secName = sec.getAttribute('data-section');
          if (activeTab === 'extras') {
            const extras = ['projects', 'certifications', 'languages', 'social'];
            if (extras.includes(secName)) {
              sec.classList.remove('tab-hidden');
            } else {
              sec.classList.add('tab-hidden');
            }
          } else {
            if (secName === activeTab) {
              sec.classList.remove('tab-hidden');
            } else {
              sec.classList.add('tab-hidden');
            }
          }
        });
      });
    });
    
    // Initialize active tab
    $('.sidebar-tab.active')?.click();
  }

  function initSidebarToolbar() {
    $('#btnStartFresh')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to start fresh? This will clear all your inputs.')) {
        startFresh();
      }
    });

    $('#btnLoadSample')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to load sample data? This will overwrite your current details.')) {
        loadSampleData();
      }
    });
  }

  function startFresh() {
    resumeData = StorageManager.getDefaults();
    StorageManager.saveData(resumeData);
    populateFormFromData();
    onDataChange();
    pushUndoState();
  }

  function loadSampleData() {
    resumeData = StorageManager.getSampleData();
    StorageManager.saveData(resumeData);
    populateFormFromData();
    onDataChange();
    pushUndoState();
  }

  function initOnboarding() {
    const visited = localStorage.getItem('resumeforge_visited');
    const modal = $('#onboardingModal');
    if (!modal) return;

    if (!visited) {
      modal.classList.add('active');
    }

    $('#onboardingStartFresh')?.addEventListener('click', () => {
      startFresh();
      localStorage.setItem('resumeforge_visited', 'true');
      modal.classList.remove('active');
    });

    $('#onboardingLoadSample')?.addEventListener('click', () => {
      loadSampleData();
      localStorage.setItem('resumeforge_visited', 'true');
      modal.classList.remove('active');
    });

    $('#onboardingImport')?.addEventListener('click', () => {
      modal.classList.remove('active');
      localStorage.setItem('resumeforge_visited', 'true');
      $('#btnImportJSON')?.click();
    });
  }


  /* ─────────────────────────────────────────────────────
     UNDO / REDO
     ───────────────────────────────────────────────────── */
  function pushUndoState() {
    const snapshot = JSON.stringify(resumeData);
    // Avoid duplicate consecutive states
    if (undoStack.length && undoStack[undoStack.length - 1] === snapshot) return;
    undoStack.push(snapshot);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
    updateUndoRedoButtons();
  }

  function undo() {
    if (undoStack.length <= 1) return;
    const current = undoStack.pop();
    redoStack.push(current);
    const prev = undoStack[undoStack.length - 1];
    resumeData = JSON.parse(prev);
    populateFormFromData();
    onDataChange();
    updateUndoRedoButtons();
  }

  function redo() {
    if (!redoStack.length) return;
    const next = redoStack.pop();
    undoStack.push(next);
    resumeData = JSON.parse(next);
    populateFormFromData();
    onDataChange();
    updateUndoRedoButtons();
  }

  function updateUndoRedoButtons() {
    const undoBtn = $('#btnUndo');
    const redoBtn = $('#btnRedo');
    const undoBtnMobile = $('#btnUndoMobile');
    const redoBtnMobile = $('#btnRedoMobile');
    
    const undoDisabled = undoStack.length <= 1;
    const redoDisabled = redoStack.length === 0;

    if (undoBtn) undoBtn.disabled = undoDisabled;
    if (undoBtnMobile) undoBtnMobile.disabled = undoDisabled;

    if (redoBtn) redoBtn.disabled = redoDisabled;
    if (redoBtnMobile) redoBtnMobile.disabled = redoDisabled;
  }


  /* ─────────────────────────────────────────────────────
     HELPERS
     ───────────────────────────────────────────────────── */
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ─────────────────────────────────────────────────────
     AI AUTOFILL WIDGET
     ───────────────────────────────────────────────────── */
  function initAiAutofillModal() {
    const modal = $('#aiAutofillModal');
    const btnOpen = $('#btnAiAutofill');
    const btnClose = $('#closeAiAutofillModal');
    const btnDoAutofill = $('#btnDoAiAutofill');
    const apiKeyInput = $('#aiApiKey');
    const rawInput = $('#aiRawInput');
    const loaderOverlay = $('#aiLoaderOverlay');
    const stepText = $('#aiStepText');

    if (!modal) return;

    // Load saved API key on open
    const openModal = () => {
      const savedKey = localStorage.getItem('resumeforge_gemini_key') || '';
      if (apiKeyInput) apiKeyInput.value = savedKey;
      modal.classList.add('active');
    };

    btnOpen?.addEventListener('click', openModal);
    btnClose?.addEventListener('click', () => {
      // Hide loader and close modal
      if (loaderOverlay) loaderOverlay.style.display = 'none';
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal && loaderOverlay && loaderOverlay.style.display === 'none') {
        modal.classList.remove('active');
      }
    });

    btnDoAutofill?.addEventListener('click', async () => {
      const apiKey = apiKeyInput.value.trim();
      const rawText = rawInput.value.trim();

      if (!apiKey) {
        alert('Please enter your Gemini API key to proceed. You can get one for free at Google AI Studio.');
        apiKeyInput.focus();
        return;
      }
      if (!rawText) {
        alert('Please paste some text describing your career background.');
        rawInput.focus();
        return;
      }

      // Save key in localStorage
      localStorage.setItem('resumeforge_gemini_key', apiKey);

      // Show loader
      if (loaderOverlay) loaderOverlay.style.display = 'flex';

      try {
        const parsedData = await AIManager.parseResume(apiKey, rawText, (step) => {
          if (stepText) stepText.textContent = step;
        });

        // Update resume data
        resumeData = { ...StorageManager.getDefaults(), ...parsedData };
        StorageManager.saveData(resumeData);
        populateFormFromData();
        onDataChange();
        pushUndoState();

        // Clear input text
        if (rawInput) rawInput.value = '';

        // Success notification
        alert('Success! Your resume details have been automatically extracted and populated.');

        // Close modal
        modal.classList.remove('active');
      } catch (err) {
        alert(`AI Parsing failed: ${err.message}`);
      } finally {
        if (loaderOverlay) loaderOverlay.style.display = 'none';
      }
    });
  }

})();
