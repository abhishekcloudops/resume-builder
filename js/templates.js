/* ═══════════════════════════════════════════════════════
   ResumeForge AI — Template Engine
   7 Premium Resume Templates
   ═══════════════════════════════════════════════════════ */

const TemplateEngine = (() => {

  /* ─── Template Registry ─── */
  const templates = [
    {
      id: 'modern-professional',
      name: 'Modern Professional',
      description: 'Clean blue sidebar layout',
      color: '#1e3a5f',
      icon: 'fa-briefcase'
    },
    {
      id: 'executive-gold',
      name: 'Executive Gold',
      description: 'Elegant gold & black design',
      color: '#d4a017',
      icon: 'fa-crown'
    },
    {
      id: 'minimal-ats',
      name: 'Minimal ATS',
      description: 'Maximum ATS compatibility',
      color: '#333333',
      icon: 'fa-robot'
    },
    {
      id: 'creative-designer',
      name: 'Creative Designer',
      description: 'Bold gradient hero section',
      color: '#667eea',
      icon: 'fa-palette'
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'LinkedIn-inspired professional',
      color: '#0a66c2',
      icon: 'fa-building'
    },
    {
      id: 'dark-premium',
      name: 'Dark Premium',
      description: 'Dark luxury with gold accents',
      color: '#1a1a2e',
      icon: 'fa-gem'
    },
    {
      id: 'elegant-timeline',
      name: 'Elegant Timeline',
      description: 'Gold accent timeline layout',
      color: '#b8860b',
      icon: 'fa-timeline'
    }
  ];

  function getTemplates() {
    return templates;
  }

  /* ─── Helpers ─── */
  function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderPhoto(data) {
    if (!data.personal.photo) return '';
    return `<img src="${data.personal.photo}" alt="${esc(data.personal.fullName)}" class="resume-photo" />`;
  }

  function renderContactItems(data) {
    const items = [];
    if (data.personal.email)   items.push(`<span class="resume-contact-item"><i class="fas fa-envelope"></i> ${esc(data.personal.email)}</span>`);
    if (data.personal.phone)   items.push(`<span class="resume-contact-item"><i class="fas fa-phone"></i> ${esc(data.personal.phone)}</span>`);
    if (data.personal.address) items.push(`<span class="resume-contact-item"><i class="fas fa-location-dot"></i> ${esc(data.personal.address)}</span>`);
    if (data.personal.website) items.push(`<span class="resume-contact-item"><i class="fas fa-globe"></i> ${esc(data.personal.website)}</span>`);
    if (data.personal.linkedin) items.push(`<span class="resume-contact-item"><i class="fab fa-linkedin"></i> ${esc(data.personal.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//,''))}</span>`);
    if (data.personal.github)  items.push(`<span class="resume-contact-item"><i class="fab fa-github"></i> ${esc(data.personal.github.replace(/^https?:\/\/(www\.)?github\.com\//,''))}</span>`);
    return items.join('');
  }

  function renderSkills(data) {
    if (!data.skills.length) return '';
    return `<div class="resume-section">
      <h2 class="resume-section-title"><i class="fas fa-star"></i> Skills</h2>
      <div class="resume-skills-grid">
        ${data.skills.map(s => `<span class="resume-skill-chip">${esc(s)}</span>`).join('')}
      </div>
    </div>`;
  }

  function renderSummary(data) {
    if (!data.summary) return '';
    return `<div class="resume-section">
      <h2 class="resume-section-title"><i class="fas fa-user"></i> Profile</h2>
      <p class="resume-entry-desc">${esc(data.summary)}</p>
    </div>`;
  }

  function renderExperience(data) {
    if (!data.experience.length) return '';
    return `<div class="resume-section">
      <h2 class="resume-section-title"><i class="fas fa-briefcase"></i> Experience</h2>
      ${data.experience.map(exp => `
        <div class="resume-entry">
          <div class="resume-entry-header">
            <h3>${esc(exp.position)}</h3>
            <span class="entry-date">${esc(exp.startDate)}${exp.endDate ? ' – ' + esc(exp.endDate) : ' – Present'}</span>
          </div>
          <div class="resume-entry-subtitle">
            ${esc(exp.company)}${exp.location ? ' · ' + esc(exp.location) : ''}
          </div>
          ${exp.responsibilities ? `<div class="resume-entry-desc"><ul>${exp.responsibilities.split('\n').filter(l=>l.trim()).map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
        </div>
      `).join('')}
    </div>`;
  }

  function renderEducation(data) {
    if (!data.education.length) return '';
    return `<div class="resume-section">
      <h2 class="resume-section-title"><i class="fas fa-graduation-cap"></i> Education</h2>
      ${data.education.map(edu => `
        <div class="resume-entry">
          <div class="resume-entry-header">
            <h3>${esc(edu.degree)}</h3>
            <span class="entry-date">${esc(edu.startYear)}${edu.endYear ? ' – ' + esc(edu.endYear) : ''}</span>
          </div>
          <div class="resume-entry-subtitle">${esc(edu.school)}</div>
          ${edu.description ? `<p class="resume-entry-desc">${esc(edu.description)}</p>` : ''}
        </div>
      `).join('')}
    </div>`;
  }

  function renderProjects(data) {
    if (!data.projects.length) return '';
    return `<div class="resume-section">
      <h2 class="resume-section-title"><i class="fas fa-diagram-project"></i> Projects</h2>
      ${data.projects.map(proj => `
        <div class="resume-entry">
          <h3>${esc(proj.name)}${proj.link ? ` <a href="${esc(proj.link)}" style="font-size:11px;color:#2563eb;font-weight:400">↗</a>` : ''}</h3>
          ${proj.description ? `<p class="resume-entry-desc">${esc(proj.description)}</p>` : ''}
          ${proj.techStack ? `<p class="resume-entry-desc" style="margin-top:3px;font-style:italic;color:#888;font-size:11.5px"><strong>Tech:</strong> ${esc(proj.techStack)}</p>` : ''}
        </div>
      `).join('')}
    </div>`;
  }

  function renderCertifications(data) {
    if (!data.certifications.length) return '';
    return `<div class="resume-section">
      <h2 class="resume-section-title"><i class="fas fa-certificate"></i> Certifications</h2>
      ${data.certifications.map(c => `<div class="resume-cert-item"><i class="fas fa-award"></i> ${esc(c.name)}</div>`).join('')}
    </div>`;
  }

  function renderLanguages(data) {
    if (!data.languages.length) return '';
    return `<div class="resume-section">
      <h2 class="resume-section-title"><i class="fas fa-language"></i> Languages</h2>
      <div class="resume-languages-grid">
        ${data.languages.map(l => `
          <span class="resume-lang-item">${esc(l.name)}${l.level ? ` <span class="resume-lang-level">(${esc(l.level)})</span>` : ''}</span>
        `).join(' · ')}
      </div>
    </div>`;
  }

  function renderSocial(data) {
    if (!data.social.length) return '';
    return `<div class="resume-section">
      <h2 class="resume-section-title"><i class="fas fa-share-nodes"></i> Links</h2>
      <div class="resume-social-row">
        ${data.social.map(s => {
          const iconMap = {
            twitter: 'fab fa-twitter', x: 'fab fa-x-twitter', facebook: 'fab fa-facebook',
            instagram: 'fab fa-instagram', youtube: 'fab fa-youtube', dribbble: 'fab fa-dribbble',
            behance: 'fab fa-behance', medium: 'fab fa-medium', stackoverflow: 'fab fa-stack-overflow',
            codepen: 'fab fa-codepen', dev: 'fab fa-dev', kaggle: 'fab fa-kaggle',
            reddit: 'fab fa-reddit', pinterest: 'fab fa-pinterest', tiktok: 'fab fa-tiktok'
          };
          const icon = iconMap[(s.platform||'').toLowerCase()] || 'fas fa-link';
          return `<span class="resume-social-item"><i class="${icon}"></i> ${esc(s.url || s.platform)}</span>`;
        }).join('')}
      </div>
    </div>`;
  }


  /* ═══════════════════════════════════════════════════════
     TEMPLATE RENDERERS
     ═══════════════════════════════════════════════════════ */

  /* ─── Template 1: Modern Professional ─── */
  function renderModernProfessional(data) {
    return `<div class="tpl-modern-professional">
      <div class="tpl-sidebar">
        ${renderPhoto(data)}
        <h1>${esc(data.personal.fullName) || 'Your Name'}</h1>
        <p class="tpl-jobtitle">${esc(data.personal.jobTitle) || 'Job Title'}</p>

        <div class="resume-section">
          <h2 class="resume-section-title"><i class="fas fa-address-card"></i> Contact</h2>
          <div class="resume-contact-row" style="flex-direction:column; gap:6px">
            ${renderContactItems(data)}
          </div>
        </div>

        ${renderSkills(data)}
        ${renderLanguages(data)}
        ${renderCertifications(data)}
        ${renderSocial(data)}
      </div>
      <div class="tpl-main">
        ${renderSummary(data)}
        ${renderExperience(data)}
        ${renderEducation(data)}
        ${renderProjects(data)}
      </div>
    </div>`;
  }

  /* ─── Template 2: Executive Gold ─── */
  function renderExecutiveGold(data) {
    return `<div class="tpl-executive-gold">
      <div class="tpl-header">
        ${renderPhoto(data)}
        <div>
          <h1>${esc(data.personal.fullName) || 'Your Name'}</h1>
          <p class="tpl-jobtitle">${esc(data.personal.jobTitle) || 'Job Title'}</p>
        </div>
      </div>
      <div class="tpl-contact-bar">
        ${renderContactItems(data)}
      </div>
      <div class="tpl-body">
        <div class="tpl-body-main">
          ${renderSummary(data)}
          ${renderExperience(data)}
          ${renderEducation(data)}
          ${renderProjects(data)}
        </div>
        <div class="tpl-body-side">
          ${renderSkills(data)}
          ${renderLanguages(data)}
          ${renderCertifications(data)}
          ${renderSocial(data)}
        </div>
      </div>
    </div>`;
  }

  /* ─── Template 3: Minimal ATS ─── */
  function renderMinimalAts(data) {
    return `<div class="tpl-minimal-ats">
      <div class="tpl-header">
        <h1>${esc(data.personal.fullName) || 'Your Name'}</h1>
        <p class="tpl-jobtitle">${esc(data.personal.jobTitle) || 'Job Title'}</p>
        <div class="resume-contact-row">
          ${renderContactItems(data)}
        </div>
      </div>
      ${renderSummary(data)}
      ${renderExperience(data)}
      ${renderEducation(data)}
      ${renderSkills(data)}
      ${renderProjects(data)}
      ${renderCertifications(data)}
      ${renderLanguages(data)}
      ${renderSocial(data)}
    </div>`;
  }

  /* ─── Template 4: Creative Designer ─── */
  function renderCreativeDesigner(data) {
    return `<div class="tpl-creative-designer">
      <div class="tpl-hero">
        ${renderPhoto(data)}
        <div class="tpl-hero-info">
          <h1>${esc(data.personal.fullName) || 'Your Name'}</h1>
          <p class="tpl-jobtitle">${esc(data.personal.jobTitle) || 'Job Title'}</p>
          <div class="resume-contact-row">
            ${renderContactItems(data)}
          </div>
        </div>
      </div>
      <div class="tpl-body">
        ${renderSummary(data)}
        ${renderExperience(data)}
        ${renderEducation(data)}
        ${renderSkills(data)}
        ${renderProjects(data)}
        ${renderCertifications(data)}
        ${renderLanguages(data)}
        ${renderSocial(data)}
      </div>
    </div>`;
  }

  /* ─── Template 5: Corporate ─── */
  function renderCorporate(data) {
    return `<div class="tpl-corporate">
      <div class="tpl-header">
        ${renderPhoto(data)}
        <div>
          <h1>${esc(data.personal.fullName) || 'Your Name'}</h1>
          <p class="tpl-jobtitle">${esc(data.personal.jobTitle) || 'Job Title'}</p>
          <div class="resume-contact-row">
            ${renderContactItems(data)}
          </div>
        </div>
      </div>
      <div class="tpl-body">
        <div class="tpl-body-main">
          ${renderSummary(data)}
          ${renderExperience(data)}
          ${renderEducation(data)}
          ${renderProjects(data)}
        </div>
        <div class="tpl-body-side">
          ${renderSkills(data)}
          ${renderCertifications(data)}
          ${renderLanguages(data)}
          ${renderSocial(data)}
        </div>
      </div>
    </div>`;
  }

  /* ─── Template 6: Dark Premium ─── */
  function renderDarkPremium(data) {
    return `<div class="tpl-dark-premium">
      <div class="tpl-sidebar">
        ${renderPhoto(data)}
        <h1>${esc(data.personal.fullName) || 'Your Name'}</h1>
        <p class="tpl-jobtitle">${esc(data.personal.jobTitle) || 'Job Title'}</p>

        <div class="resume-section">
          <h2 class="resume-section-title"><i class="fas fa-address-card"></i> Contact</h2>
          <div class="resume-contact-row" style="flex-direction:column; gap:6px">
            ${renderContactItems(data)}
          </div>
        </div>

        ${renderSkills(data)}
        ${renderLanguages(data)}
        ${renderCertifications(data)}
        ${renderSocial(data)}
      </div>
      <div class="tpl-main">
        ${renderSummary(data)}
        ${renderExperience(data)}
        ${renderEducation(data)}
        ${renderProjects(data)}
      </div>
    </div>`;
  }

  /* ─── Template 7: Elegant Timeline ─── */
  function renderElegantTimeline(data) {
    // Experience rendered inside a timeline wrapper with dot markers
    function renderTimelineExperience(data) {
      if (!data.experience.length) return '';
      return `<div class="resume-section">
        <h2 class="resume-section-title"><i class="fas fa-briefcase"></i> Experience</h2>
        <div class="tpl-timeline">
          ${data.experience.map(exp => `
            <div class="resume-entry">
              <h3>${esc(exp.position)}</h3>
              <div class="resume-entry-subtitle">${esc(exp.company)}</div>
              <span class="entry-date">${esc(exp.startDate)}${exp.endDate ? ' – ' + esc(exp.endDate) : ' – Present'}</span>
              ${exp.responsibilities ? `<div class="resume-entry-desc"><p>${exp.responsibilities.split('\n').filter(l=>l.trim()).map(l=>esc(l)).join('. ')}</p></div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>`;
    }

    return `<div class="tpl-elegant-timeline">
      <div class="tpl-sidebar">
        ${renderPhoto(data)}

        <div class="resume-section">
          <h2 class="resume-section-title"><i class="fas fa-graduation-cap"></i> Education</h2>
          ${data.education.length ? data.education.map(edu => `
            <div class="resume-entry">
              <h3 style="font-size:15px;font-weight:700;color:#222">${esc(edu.degree)}</h3>
              <div class="resume-entry-subtitle">${esc(edu.school)}</div>
              ${edu.startYear || edu.endYear ? `<span class="entry-date" style="font-size:12px;color:#b8860b">${esc(edu.startYear)}${edu.endYear ? ' – ' + esc(edu.endYear) : ''}</span>` : ''}
              ${edu.description ? `<p class="resume-entry-desc">${esc(edu.description)}</p>` : ''}
            </div>
          `).join('') : '<p style="color:#888;font-size:13px">Add your education</p>'}
        </div>

        ${renderSkills(data)}
        ${renderLanguages(data)}

        <div class="resume-section">
          <h2 class="resume-section-title"><i class="fas fa-address-card"></i> Contact</h2>
          <div class="resume-contact-row" style="flex-direction:column; gap:6px">
            ${renderContactItems(data)}
          </div>
        </div>

        ${renderCertifications(data)}
        ${renderSocial(data)}
      </div>
      <div class="tpl-main">
        <div class="tpl-header">
          <h1>${esc(data.personal.fullName) || 'Your Name'}</h1>
          <p class="tpl-jobtitle">${esc(data.personal.jobTitle) || 'Job Title'}</p>
        </div>
        <div class="tpl-content">
          ${renderSummary(data)}
          ${renderTimelineExperience(data)}
          ${renderProjects(data)}
        </div>
      </div>
    </div>`;
  }

  /* ─── Dispatch ─── */
  const renderers = {
    'modern-professional': renderModernProfessional,
    'executive-gold': renderExecutiveGold,
    'minimal-ats': renderMinimalAts,
    'creative-designer': renderCreativeDesigner,
    'corporate': renderCorporate,
    'dark-premium': renderDarkPremium,
    'elegant-timeline': renderElegantTimeline
  };

  function render(templateId, data) {
    const fn = renderers[templateId] || renderModernProfessional;
    return fn(data);
  }

  return { getTemplates, render };
})();
