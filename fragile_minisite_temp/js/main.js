function determineLanguage() {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang) return urlLang;

    const stored = localStorage.getItem('preferredLanguage');
    if (stored) return stored;

    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang && browserLang.startsWith('fr')) return 'fr';
    if (browserLang && browserLang.startsWith('nl')) return 'nl';
    return 'en';
}

function updateLanguageInUrl(lang) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());
}

function buildLangAwareUrl(baseHref, lang) {
    if (!baseHref) return '';
    const hasQuery = baseHref.includes('?');
    const separator = hasQuery ? '&' : '?';
    return `${baseHref}${separator}lang=${lang}`;
}

function updateLangAwareLinks(lang) {
    document.querySelectorAll('[data-lang-link]').forEach(link => {
        const base = link.dataset.baseHref || link.getAttribute('href');
        link.setAttribute('href', buildLangAwareUrl(base, lang));
    });
}

function setLanguage(lang, options = {}) {
    const opts = {
        updateUrl: options.updateUrl !== false,
        updateStorage: options.updateStorage !== false
    };

    const hasLangContent = document.querySelector('.lang-content') !== null;

    // Hide all content
    document.querySelectorAll('.lang-content').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.lang-banner').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('[data-lang-block]').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected or fallback
    let selected = document.getElementById(`content-${lang}`);
    if (hasLangContent && !selected) {
        lang = 'en';
        selected = document.getElementById(`content-${lang}`);
    }
    if (selected) {
        selected.style.display = 'block';
    }
    const banner = document.getElementById(`banner-${lang}`);
    if (banner) {
        banner.style.display = 'block';
    }
    document.querySelectorAll(`[data-lang-block=\"${lang}\"]`).forEach(el => {
        el.style.display = '';
    });

    // Update dropdown
    const dropdown = document.getElementById('language-dropdown');
    if (dropdown) {
        dropdown.value = lang;
    }

    // Update back-link text per language
    const backLinkTexts = {
        fr: '← Retour à la présentation',
        nl: '← Terug naar de presentatie',
        en: '← Back to presentation'
    };
    const linkLabels = {
        moreInfo: {
            fr: 'Informations détaillées',
            nl: 'Uitgebreide informatie',
            en: 'More Detailed Information'
        },
        colophon: {
            fr: 'Colophon',
            nl: 'Colofon',
            en: 'Colophon'
        }
    };

    document.querySelectorAll('.back-link').forEach(link => {
        if (backLinkTexts[lang]) {
            link.textContent = backLinkTexts[lang];
        }
    });

    const moreInfoLink = document.getElementById('more-info-link');
    if (moreInfoLink && linkLabels.moreInfo[lang]) {
        moreInfoLink.textContent = linkLabels.moreInfo[lang];
    }
    const colophonLink = document.getElementById('colophon-link');
    if (colophonLink && linkLabels.colophon[lang]) {
        colophonLink.textContent = linkLabels.colophon[lang];
    }

    // Save preference
    if (opts.updateStorage) {
        localStorage.setItem('preferredLanguage', lang);
    }

    // Sync URL and links
    updateLangAwareLinks(lang);
    if (opts.updateUrl) {
        updateLanguageInUrl(lang);
    }
}

function renderMarkdown() {
    if (typeof marked === 'undefined') return;
    
    document.querySelectorAll('.lang-content.markdown').forEach(el => {
        if (el.dataset.rendered === 'true') return;
        
        // Get content and simple dedent
        let lines = el.innerHTML.split('\n');
        
        // Remove first and last line if empty (common in HTML formatting)
        if (lines.length > 0 && lines[0].trim() === '') lines.shift();
        if (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
        
        // Find minimum indentation
        let minIndent = Infinity;
        lines.forEach(line => {
            if (line.trim().length > 0) {
                const match = line.match(/^\s*/);
                const indent = match ? match[0].length : 0;
                if (indent < minIndent) minIndent = indent;
            }
        });
        
        if (minIndent !== Infinity && minIndent > 0) {
            lines = lines.map(line => line.length >= minIndent ? line.slice(minIndent) : line);
        }
        
        const markdownText = lines.join('\n');
        
        // Parse
        el.innerHTML = marked.parse(markdownText);
        el.dataset.rendered = 'true';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderMarkdown();

    // Initial language resolution
    const lang = determineLanguage();
    setLanguage(lang, { updateUrl: true, updateStorage: true });

    // Bind dropdown change
    const dropdown = document.getElementById('language-dropdown');
    if (dropdown) {
        dropdown.addEventListener('change', (event) => {
            setLanguage(event.target.value, { updateUrl: true, updateStorage: true });
        });
    }
});
