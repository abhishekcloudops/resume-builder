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
        fullName: 'Ankita Kumari',
        jobTitle: 'Supply Chain & Logistics Specialist',
        email: 'theankitasharmacre@gmail.com',
        phone: '+91-8825215811',
        address: 'Patna, Bihar',
        website: '',
        linkedin: 'https://linkedin.com/in/ankita-sharma-77222b180',
        github: '',
        photo: 'assets/images/ankita.jpg'
      },
      summary: 'Detail-oriented Supply Chain Professional experienced in international freight operations across USA and Canada. Skilled in FTL/LTL, drayage logistics, SAP, CRM systems, and advanced Excel. Proven ability to onboard new clients, improve shipment volume, and maintain strong customer relationships.',
      skills: [
        'Freight Operations',
        'SAP ERP & CRM',
        'FTL / LTL & Drayage',
        'Advanced Excel & Office',
        'CRM Management',
        'Client Relationship'
      ],
      experience: [
        {
          position: 'Business Development Executive',
          company: 'Unify Logistic Solutions',
          location: 'USA Operations',
          startDate: 'Mar 2025',
          endDate: 'Present',
          responsibilities: 'Onboarded 20+ clients\nManaged USA transportation\nCoordinated FTL/LTL and drayage shipments\nExceeded business development targets'
        },
        {
          position: 'Inside Sales Executive',
          company: 'DeHaat',
          location: 'Patna, Bihar',
          startDate: 'Nov 2024',
          endDate: 'Mar 2025',
          responsibilities: 'Generated and converted leads\nAchieved sales targets\nBuilt customer relationships\nManaged post-sales support'
        },
        {
          position: 'Customer Service Specialist',
          company: 'Alorica',
          location: 'Customer Support Division',
          startDate: 'Mar 2023',
          endDate: 'Mar 2024',
          responsibilities: 'Handled customer support\nProcessed accounts\nGenerated 100+ leads monthly\nContributed to a 35% performance improvement'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Commerce',
          school: 'Patna University',
          startYear: '2020',
          endYear: '2023',
          description: 'Specialized in accounting and finance. Participated in debates and cultural events.'
        }
      ],
      projects: [],
      certifications: [
        {
          name: 'Supply Chain Foundations - LinkedIn Learning'
        },
        {
          name: 'Advanced Google Excel Certificate'
        }
      ],
      languages: [
        {
          name: 'Hindi',
          level: 'Native'
        },
        {
          name: 'English',
          level: 'C1 Advanced'
        }
      ],
      social: [
        {
          platform: 'LinkedIn',
          url: 'https://linkedin.com/in/ankita-sharma-77222b180'
        }
      ]
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
