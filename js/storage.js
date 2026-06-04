/* ═══════════════════════════════════════════════════════
   ResumeForge AI — Local Storage Manager
   ═══════════════════════════════════════════════════════ */

const StorageManager = (() => {
  const STORAGE_KEY = 'resumeforge_data';
  const TEMPLATE_KEY = 'resumeforge_template';
  const THEME_KEY = 'resumeforge_theme';
  const SECTION_ORDER_KEY = 'resumeforge_section_order';

  /**
   * Get default resume data structure
   */
  function getDefaults() {
    return {
      personal: {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        linkedin: '',
        github: '',
        photo: '' // base64
      },
      summary: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      social: []
    };
  }

  /**
   * Save all resume data
   */
  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('StorageManager: Could not save data', e);
      return false;
    }
  }

  /**
   * Load resume data
   */
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaults();
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure all keys exist
      const defaults = getDefaults();
      return {
        personal: { ...defaults.personal, ...(parsed.personal || {}) },
        summary: parsed.summary || '',
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        education: Array.isArray(parsed.education) ? parsed.education : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
        languages: Array.isArray(parsed.languages) ? parsed.languages : [],
        social: Array.isArray(parsed.social) ? parsed.social : []
      };
    } catch (e) {
      console.warn('StorageManager: Could not load data', e);
      return getDefaults();
    }
  }

  /**
   * Save selected template ID
   */
  function saveTemplate(templateId) {
    try { localStorage.setItem(TEMPLATE_KEY, templateId); } catch(e) {}
  }

  /**
   * Load selected template ID
   */
  function loadTemplate() {
    return localStorage.getItem(TEMPLATE_KEY) || 'modern-professional';
  }

  /**
   * Save theme preference
   */
  function saveTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
  }

  /**
   * Load theme preference
   */
  function loadTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  /**
   * Save section order
   */
  function saveSectionOrder(order) {
    try { localStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(order)); } catch(e) {}
  }

  /**
   * Load section order
   */
  function loadSectionOrder() {
    try {
      const raw = localStorage.getItem(SECTION_ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) {
      return null;
    }
  }

  /**
   * Clear all stored data
   */
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TEMPLATE_KEY);
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(SECTION_ORDER_KEY);
  }

  /**
   * Export all data as JSON string
   */
  function exportJSON(data, templateId) {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      template: templateId,
      resumeData: data
    }, null, 2);
  }

  /**
   * Parse imported JSON and return { data, template }
   */
  function importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.resumeData) {
        return {
          data: parsed.resumeData,
          template: parsed.template || 'modern-professional'
        };
      }
      // Try treating as raw resume data
      if (parsed.personal) {
        return { data: parsed, template: 'modern-professional' };
      }
      throw new Error('Invalid format');
    } catch (e) {
      throw new Error('Invalid JSON format: ' + e.message);
    }
  }

  return {
    getDefaults,
    saveData,
    loadData,
    saveTemplate,
    loadTemplate,
    saveTheme,
    loadTheme,
    saveSectionOrder,
    loadSectionOrder,
    clearAll,
    exportJSON,
    importJSON
  };
})();
