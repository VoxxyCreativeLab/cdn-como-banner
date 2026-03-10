(function () {
    if (window.comoConsentInitialized) return;
    window.comoConsentInitialized = true;

    /* ═══════════════════════════════════════════════
       CONFIGURATION
       Site owners set these BEFORE this script loads:

       window.comoRegion          = 'NL';
       window.comoLang            = 'nl';        // override language (optional)
       window.comoPrivacyUrl      = 'https://example.com/privacy';
       window.comoDataController  = 'Company Name';
       window.comoLogoUrl         = 'https://example.com/logo.png';
       window.comoFontUrl         = 'https://example.com/fonts/plus-jakarta-sans.css';
       window.comoLogEndpoint     = 'https://api.example.com/consent-log';
       window.comoPrimaryColor    = '#0b4650';   // buttons, tabs, active states
       // button text auto-computed from primary luminance
       window.comoBgColor         = '#f9f7f2';   // banner background
       window.comoTextColor       = '#0b4650';   // body text in banner
       ═══════════════════════════════════════════════ */

    var cfg = {
        version: '1',
        cookieName: 'vcl_consent',
        bannerId: 'comoBanner',
        overlayId: 'comoOverlay',
        widgetId: 'comoWidget',
        region: 'unknown',
        privacyPolicyUrl: window.comoPrivacyUrl || '',
        dataController: window.comoDataController || '',
        logoUrl: window.comoLogoUrl || 'https://voxxycreativelab.com/storage/2025/03/cropped-VCL-Logo-Homepage-2.0.1-450x150-Light-font-change-to-Exo2.png',
        fontUrl: window.comoFontUrl || '',
        logEndpoint: window.comoLogEndpoint || '',
        primaryColor: window.comoPrimaryColor || '#0b4650',
        // accentColor removed — button text is auto-computed from primary luminance
        bgColor: window.comoBgColor || '#f9f7f2',
        textColor: window.comoTextColor || '#0b4650',
        showOverlay: !window.comoDisableOverlay,
        buttonStyle: window.comoButtonStyle || 'filled',
        buttonTextColor: window.comoButtonTextColor || 'auto',
        borderWidth: window.comoBorderWidth || '2px',
        cornerStyle: window.comoCornerStyle || 'rounded',
        surfaceIntensity: window.comoSurfaceIntensity || 'auto'
    };

    /* ═══════════════════════════════════════════════
       FALLBACK CONFIG
       Used only when remote config fails to load AND
       no inline config (window.comoConfig) is provided.
       Opt-in only (strictest/safest).
       ═══════════════════════════════════════════════ */

    var FALLBACK_CONFIG = {
        configVersion: '2.0.0',
        consentMode: { waitForUpdate: 500 },
        regions: {},
        models: {
            'opt-in': {
                defaults: { necessary: true, preferences: false, analytics: false, marketing: false },
                requireExplicit: true,
                honorGpc: false,
                showCloseButton: false,
                showBanner: true,
                buttonConfig: 'full'
            },
            'none': {
                defaults: { necessary: true, preferences: true, analytics: true, marketing: true },
                requireExplicit: false,
                honorGpc: false,
                showCloseButton: false,
                showBanner: false,
                buttonConfig: 'none'
            }
        },
        fallbackModel: 'opt-in',
        languages: ['en'],
        expiry: { 'default': 365, regions: {} },
        categories: [
            { key: 'necessary', alwaysOn: true, consentTypes: ['security_storage'] },
            { key: 'preferences', alwaysOn: false, consentTypes: ['functionality_storage', 'personalization_storage'] },
            { key: 'analytics', alwaysOn: false, consentTypes: ['analytics_storage'] },
            { key: 'marketing', alwaysOn: false, consentTypes: ['ad_storage', 'ad_user_data', 'ad_personalization'] }
        ],
        texts: {
            en: {
                banner: {
                    title: 'We use cookies',
                    description: 'This website uses cookies. Please choose your cookie preferences.'
                },
                tabs: { consent: 'Consent', details: 'Details', about: 'About' },
                buttons: { allowAll: 'Allow all', denyAll: 'Deny all', customize: 'Customize', allowSelection: 'Allow selection', managePreferences: 'Manage preferences' },
                about: {
                    title: 'About Cookies',
                    description: 'Cookies are small text files stored on your device.',
                    privacyLink: 'For more information, see our {link}.',
                    privacyLinkText: 'Privacy Policy',
                    controllerText: 'This website is operated by {controller}. As the data controller, we are responsible for the processing of your personal data.'
                },
                categories: {
                    necessary: { name: 'Necessary', description: 'Required for the website to function.' },
                    preferences: { name: 'Preferences', description: 'Remember your preferences.' },
                    analytics: { name: 'Statistics', description: 'Help us understand how visitors use this website.' },
                    marketing: { name: 'Marketing', description: 'Used to track visitors across websites.' }
                },
                closeButton: { ariaLabel: 'Dismiss' },
                widget: { ariaLabel: 'Manage cookie preferences' },
                aria: { toggleLabel: '{name} cookies', toggleLabelAlwaysOn: '{name} cookies (always active)' }
            }
        }
    };

    var globalConfig = FALLBACK_CONFIG;
    var resolvedLang = 'en';

    /* ═══════════════════════════════════════════════
       CONFIG LOADING
       Priority: window.comoConfig > window.comoConfigUrl > CDN
       ═══════════════════════════════════════════════ */

    var CONFIG_CDN_URL = 'https://cdn.jsdelivr.net/gh/VoxxyCreativeLab/cdn-como-banner@v1/como-global.json';
    var LANG_CDN_BASE = 'https://cdn.jsdelivr.net/gh/VoxxyCreativeLab/cdn-como-banner@v1/lang/';
    var GEO_ENDPOINT_URL = 'https://como-geo.voxxycreativelab.workers.dev';
    var GEO_COOKIE_NAME = 'vcl_geo';
    var GEO_COOKIE_EXPIRY = 30; // days (before consent; synced to consent expiry after)

    function loadConfig(callback) {
        if (window.comoConfig && typeof window.comoConfig === 'object') {
            globalConfig = window.comoConfig;
            callback(null);
            return;
        }

        var url = window.comoConfigUrl || CONFIG_CDN_URL;

        fetch(url)
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                globalConfig = data;
                callback(null);
            })
            .catch(function (err) {
                console.warn('[CoMo Banner] Config load failed (' + url + '):', err.message, '— using fallback config');
                globalConfig = FALLBACK_CONFIG;
                callback(err);
            });
    }

    /* ═══════════════════════════════════════════════
       LANGUAGE FILE LOADING
       Per-language files fetched separately from CDN.
       English is embedded in core config as fallback.
       ═══════════════════════════════════════════════ */

    function loadLanguage(lang, callback) {
        var url = LANG_CDN_BASE + lang + '.json';

        fetch(url)
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                globalConfig.texts[lang] = data;
                callback();
            })
            .catch(function (err) {
                console.warn('[CoMo Banner] Language load failed (' + lang + '):', err.message, '— using English');
                resolvedLang = 'en';
                callback();
            });
    }

    /* ═══════════════════════════════════════════════
       REGION RESOLUTION
       Priority: window.comoRegion > vcl_geo cookie > geo endpoint > 'unknown'
       ═══════════════════════════════════════════════ */

    function resolveRegion(callback) {
        // 1. Explicit region set (GTM template or manual)
        if (window.comoRegion) {
            cfg.region = window.comoRegion;
            callback();
            return;
        }

        // 2. Cached geo cookie (no API call needed)
        var geoCookie = readCookie(GEO_COOKIE_NAME);
        if (geoCookie) {
            cfg.region = geoCookie;
            callback();
            return;
        }

        // 3. Fetch from geo endpoint
        fetch(GEO_ENDPOINT_URL)
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                var region = (data && data.region) ? data.region : 'unknown';
                cfg.region = region;
                if (region !== 'unknown') {
                    setCookie(GEO_COOKIE_NAME, region, GEO_COOKIE_EXPIRY);
                }
                callback();
            })
            .catch(function (err) {
                console.warn('[CoMo Banner] Geo detection failed:', err.message, '— defaulting to opt-in');
                cfg.region = 'unknown';
                callback();
            });
    }

    function validateConfig(config) {
        if (!config || typeof config !== 'object') return false;
        if (!config.models || typeof config.models !== 'object') return false;
        if (!config.categories || !Array.isArray(config.categories)) return false;
        if (!config.texts || typeof config.texts !== 'object') return false;
        if (!config.fallbackModel || !config.models[config.fallbackModel]) return false;
        return true;
    }

    /* ═══════════════════════════════════════════════
       LANGUAGE RESOLUTION
       Priority: comoLang > <html lang> > navigator > 'en'
       Called once after config loads.
       ═══════════════════════════════════════════════ */

    function matchLanguage(tag, available) {
        if (!tag) return null;
        var lower = tag.toLowerCase();
        // Exact match (e.g. 'zh-TW' if config has 'zh-TW')
        for (var i = 0; i < available.length; i++) {
            if (available[i].toLowerCase() === lower) return available[i];
        }
        // Primary subtag (e.g. 'pt-BR' → 'pt', 'nl-NL' → 'nl')
        var primary = lower.split('-')[0];
        for (var i = 0; i < available.length; i++) {
            if (available[i].toLowerCase() === primary) return available[i];
        }
        return null;
    }

    function resolveLanguage() {
        var available = globalConfig.languages || Object.keys(globalConfig.texts || {});

        // 1. Explicit override
        if (window.comoLang && typeof window.comoLang === 'string') {
            var explicit = matchLanguage(window.comoLang, available);
            if (explicit) return explicit;
        }

        // 2. <html lang> attribute
        var htmlLang = document.documentElement.lang;
        if (htmlLang) {
            var fromHtml = matchLanguage(htmlLang, available);
            if (fromHtml) return fromHtml;
        }

        // 3. navigator.languages (subtag matching)
        var navLangs = navigator.languages || (navigator.language ? [navigator.language] : []);
        for (var i = 0; i < navLangs.length; i++) {
            var fromNav = matchLanguage(navLangs[i], available);
            if (fromNav) return fromNav;
        }

        // 4. Default
        return 'en';
    }

    /* ═══════════════════════════════════════════════
       CONFIG HELPERS
       ═══════════════════════════════════════════════ */

    function getTextFromLang(langTexts, parts) {
        var current = langTexts;
        for (var i = 0; i < parts.length; i++) {
            if (current && typeof current === 'object') {
                current = current[parts[i]];
            } else {
                return undefined;
            }
        }
        return (typeof current === 'string') ? current : undefined;
    }

    function getText(path) {
        var texts = globalConfig.texts || {};
        var parts = path.split('.');

        // Try resolved language first
        if (resolvedLang !== 'en' && texts[resolvedLang]) {
            var result = getTextFromLang(texts[resolvedLang], parts);
            if (result !== undefined) return result;
        }

        // Fallback to English (per-key)
        var en = getTextFromLang(texts['en'] || {}, parts);
        return (en !== undefined) ? en : '';
    }

    function buildConsentModeState(permissions) {
        var state = {};
        var categories = globalConfig.categories || [];
        for (var i = 0; i < categories.length; i++) {
            var cat = categories[i];
            var granted = cat.alwaysOn || (permissions[cat.key] === true);
            var value = granted ? 'granted' : 'denied';
            var types = cat.consentTypes || [];
            for (var j = 0; j < types.length; j++) {
                state[types[j]] = value;
            }
        }
        return state;
    }

    /* ═══════════════════════════════════════════════
       REGION MODES & MAPPING (config-driven)
       ═══════════════════════════════════════════════ */

    function getModelName() {
        var regions = globalConfig.regions || {};
        return regions[cfg.region] || globalConfig.fallbackModel || 'opt-in';
    }

    function getMode() {
        var name = getModelName();
        return globalConfig.models[name] || globalConfig.models[globalConfig.fallbackModel];
    }

    function getButtonConfig() {
        var override = globalConfig.regionOverrides && globalConfig.regionOverrides[cfg.region];
        if (override && override.buttonConfig) return override.buttonConfig;
        var mode = getMode();
        return mode.buttonConfig || 'full';
    }

    function getConsentExpiry() {
        var expiry = globalConfig.expiry || {};
        var regionExpiry = expiry.regions || {};
        return regionExpiry[cfg.region] || expiry['default'] || 365;
    }

    /* ═══════════════════════════════════════════════
       GPC (GLOBAL PRIVACY CONTROL) DETECTION
       ═══════════════════════════════════════════════ */

    function isGpcEnabled() {
        return navigator.globalPrivacyControl === true;
    }

    function getEffectiveDefaults() {
        var mode = getMode();
        var d = {
            necessary: true,
            preferences: mode.defaults.preferences,
            analytics: mode.defaults.analytics,
            marketing: mode.defaults.marketing
        };
        if (mode.honorGpc && isGpcEnabled()) {
            d.analytics = false;
            d.marketing = false;
        }
        return d;
    }

    /* ═══════════════════════════════════════════════
       GTM / GOOGLE CONSENT MODE V2
       Consent defaults are fired after config loads,
       with correct region-specific values. No
       pessimistic-then-update pattern needed.
       ═══════════════════════════════════════════════ */

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    /* ═══════════════════════════════════════════════
       CONSENT STATE
       ═══════════════════════════════════════════════ */

    var consentState = {
        version: cfg.version,
        explicitConsent: false,
        permissions: { necessary: true, preferences: false, analytics: false, marketing: false }
    };

    /* ═══════════════════════════════════════════════
       COOKIE HELPERS
       ═══════════════════════════════════════════════ */

    function readCookie(name) {
        var nameEQ = name + '=';
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length));
            }
        }
        return null;
    }

    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var d = new Date();
            d.setTime(d.getTime() + (days * 86400000));
            expires = '; expires=' + d.toUTCString();
        }
        var secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax' + secure;
    }

    function deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    /* ═══════════════════════════════════════════════
       COLOR HELPERS
       ═══════════════════════════════════════════════ */

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        var num = parseInt(hex, 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }

    function getLuma(rgb) {
        return (rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722) / 255;
    }

    /* ═══════════════════════════════════════════════
       CONSENT MODE UPDATE & EVENTS
       ═══════════════════════════════════════════════ */

    function updateConsentMode(permissions) {
        gtag('consent', 'update', buildConsentModeState(permissions));
    }

    function sendConsentEvents(type, permissions) {
        updateConsentMode(permissions);
        setTimeout(function () {
            dataLayer.push({
                'event': 'cookie_consent_update',
                'consentType': type,
                'permissions': permissions,
                'gpcEnabled': isGpcEnabled(),
                'region': cfg.region
            });
            if (permissions.analytics) {
                dataLayer.push({ 'event': 'cookie_consent_statistics' });
            }
            if (permissions.marketing) {
                dataLayer.push({ 'event': 'cookie_consent_marketing' });
            }
            if (permissions.preferences) {
                dataLayer.push({ 'event': 'cookie_consent_preferences' });
            }
        }, 200);
    }

    /* ═══════════════════════════════════════════════
       SERVER-SIDE CONSENT LOGGING
       ═══════════════════════════════════════════════ */

    function logConsent(type, permissions) {
        if (!cfg.logEndpoint) return;
        try {
            var payload = JSON.stringify({
                timestamp: new Date().toISOString(),
                action: type,
                permissions: permissions,
                bannerVersion: cfg.version,
                gpcEnabled: isGpcEnabled(),
                region: cfg.region,
                pageUrl: location.href
            });
            if (navigator.sendBeacon) {
                navigator.sendBeacon(cfg.logEndpoint, payload);
            } else {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', cfg.logEndpoint, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(payload);
            }
        } catch (e) { /* silent */ }
    }

    /* ═══════════════════════════════════════════════
       BANNER ACTIONS
       ═══════════════════════════════════════════════ */

    function handleConsent(type) {
        var permissions = { necessary: true };
        var toggles = document.querySelectorAll('.como-toggle');
        for (var i = 0; i < toggles.length; i++) {
            var cat = toggles[i].getAttribute('data-category');
            if (type === 'accept-all') {
                permissions[cat] = true;
            } else if (type === 'deny-all' && cat !== 'necessary') {
                permissions[cat] = false;
            } else {
                permissions[cat] = toggles[i].classList.contains('active');
            }
        }
        permissions.necessary = true;

        consentState.permissions = permissions;
        consentState.explicitConsent = true;

        var consentExpiry = getConsentExpiry();
        setCookie(cfg.cookieName, JSON.stringify({
            version: consentState.version,
            permissions: permissions,
            explicitConsent: true,
            timestamp: new Date().toISOString(),
            region: cfg.region,
            gpcApplied: isGpcEnabled()
        }), consentExpiry);
        setCookie(GEO_COOKIE_NAME, cfg.region, consentExpiry);

        closeBanner();
        showWidget();
        sendConsentEvents(type, permissions);
        logConsent(type, permissions);

        window.comoConsent = consentState;
    }

    /* ═══════════════════════════════════════════════
       BANNER SHOW / HIDE
       No cookie wall: page remains scrollable
       ═══════════════════════════════════════════════ */

    /* Fallback for browsers without dvh support: use window.innerHeight */
    function fixBannerHeight() {
        var banner = document.getElementById(cfg.bannerId);
        if (!banner || banner.style.display === 'none') return;
        var gap = window.innerWidth <= 600 ? 16 : 32;
        banner.style.maxHeight = (window.innerHeight - gap) + 'px';
    }

    var dvhSupported = (function () {
        try {
            var el = document.createElement('div');
            el.style.maxHeight = '100dvh';
            return el.style.maxHeight === '100dvh';
        } catch (e) { return false; }
    })();

    if (!dvhSupported) {
        window.addEventListener('resize', fixBannerHeight);
        window.addEventListener('orientationchange', function () {
            setTimeout(fixBannerHeight, 150);
        });
    }

    function showBanner() {
        var banner = document.getElementById(cfg.bannerId);
        var overlay = document.getElementById(cfg.overlayId);
        if (banner && overlay) {
            banner.style.display = '';
            if (!dvhSupported) fixBannerHeight();
            if (cfg.showOverlay) overlay.style.display = 'block';
            hideWidget();

            /* Sync toggle states to stored consent (if any) */
            if (consentState.permissions) {
                var toggles = document.querySelectorAll('.como-toggle');
                for (var i = 0; i < toggles.length; i++) {
                    if (toggles[i].classList.contains('disabled')) continue;
                    var cat = toggles[i].getAttribute('data-category');
                    if (consentState.permissions[cat]) {
                        toggles[i].classList.add('active');
                        toggles[i].setAttribute('aria-checked', 'true');
                    } else {
                        toggles[i].classList.remove('active');
                        toggles[i].setAttribute('aria-checked', 'false');
                    }
                }
                updateAllowBtn();
            }
        }
    }

    function closeBanner() {
        var banner = document.getElementById(cfg.bannerId);
        var overlay = document.getElementById(cfg.overlayId);
        if (banner && overlay) {
            banner.style.display = 'none';
            if (cfg.showOverlay) overlay.style.display = 'none';
        }
    }

    /* ═══════════════════════════════════════════════
       RE-OPEN CONSENT WIDGET
       Floating button shown after banner is dismissed
       ═══════════════════════════════════════════════ */

    function showWidget() {
        var widget = document.getElementById(cfg.widgetId);
        if (widget) widget.style.display = 'flex';
    }

    function hideWidget() {
        var widget = document.getElementById(cfg.widgetId);
        if (widget) widget.style.display = 'none';
    }

    /* ═══════════════════════════════════════════════
       TAB SWITCHING
       ═══════════════════════════════════════════════ */

    function switchTab(tab) {
        var panels = document.querySelectorAll('.como-panel');
        var tabs = document.querySelectorAll('.como-tab');
        for (var i = 0; i < panels.length; i++) panels[i].classList.remove('active');
        for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');

        var panel = document.getElementById(tab + 'Panel');
        if (panel) panel.classList.add('active');

        for (var k = 0; k < tabs.length; k++) {
            if (tabs[k].getAttribute('data-tab') === tab) {
                tabs[k].classList.add('active');
                break;
            }
        }
    }

    /* ═══════════════════════════════════════════════
       CATEGORY EXPAND / COLLAPSE
       ═══════════════════════════════════════════════ */

    function toggleCategory(header) {
        var category = header.closest('.como-category');
        var all = document.querySelectorAll('.como-category');
        for (var i = 0; i < all.length; i++) {
            if (all[i] !== category) all[i].classList.remove('expanded');
        }
        category.classList.toggle('expanded');
    }

    /* ═══════════════════════════════════════════════
       TOGGLE SWITCHES
       ═══════════════════════════════════════════════ */

    function toggleSwitch(toggle, event) {
        if (event) event.stopPropagation();
        if (toggle.classList.contains('disabled')) return;
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-checked', toggle.classList.contains('active') ? 'true' : 'false');
        updateAllowBtn();
    }

    function updateAllowBtn() {
        var btn = document.getElementById('comoAllowBtn');
        if (!btn) return;
        var toggles = document.querySelectorAll('.como-toggle:not(.disabled)');
        var allActive = true;
        for (var i = 0; i < toggles.length; i++) {
            if (!toggles[i].classList.contains('active')) { allActive = false; break; }
        }
        btn.textContent = allActive ? getText('buttons.allowAll') : getText('buttons.allowSelection');
        btn._consentType = allActive ? 'accept-all' : 'selected';
    }

    /* ═══════════════════════════════════════════════
       CHECK EXISTING CONSENT
       ═══════════════════════════════════════════════ */

    function checkExistingConsent() {
        var existing = readCookie(cfg.cookieName);
        if (!existing) {
            showBanner();
            return;
        }
        try {
            var parsed = JSON.parse(existing);
            if (parsed.version !== cfg.version) {
                showBanner();
            } else {
                consentState = parsed;
                window.comoConsent = consentState;
                showWidget();
                sendConsentEvents('existing', parsed.permissions);
            }
        } catch (e) {
            showBanner();
        }
    }

    /* ═══════════════════════════════════════════════
       BUILD BANNER HTML
       Text and categories driven by globalConfig.
       Language resolved via resolveLanguage() with
       per-key English fallback.
       ═══════════════════════════════════════════════ */

    function createBannerHTML() {
        var defaults = getEffectiveDefaults();
        var model = getMode();

        /* Color computation for dynamic theming */
        var pRgb = hexToRgb(cfg.primaryColor);
        var tRgb = hexToRgb(cfg.textColor);
        var bRgb = hexToRgb(cfg.bgColor);
        function pRgba(o) { return 'rgba(' + pRgb[0] + ',' + pRgb[1] + ',' + pRgb[2] + ',' + o + ')'; }
        function tRgba(o) { return 'rgba(' + tRgb[0] + ',' + tRgb[1] + ',' + tRgb[2] + ',' + o + ')'; }
        /* Auto-compute button text: white on dark primary, black on light primary.
           Override with cfg.buttonTextColor if set (not 'auto'). */
        var btnText = cfg.buttonTextColor !== 'auto'
            ? cfg.buttonTextColor
            : (getLuma(pRgb) < 0.5 ? '#ffffff' : '#000000');
        /* Outline color: custom buttonTextColor for outline buttons, or primary when auto */
        var btnOutline = cfg.buttonTextColor !== 'auto' ? cfg.buttonTextColor : cfg.primaryColor;
        var oRgb = hexToRgb(btnOutline);
        function oRgba(o) { return 'rgba(' + oRgb[0] + ',' + oRgb[1] + ',' + oRgb[2] + ',' + o + ')'; }
        var primaryDark = 'rgb(' +
            Math.max(0, Math.round(pRgb[0] * 0.82)) + ',' +
            Math.max(0, Math.round(pRgb[1] * 0.82)) + ',' +
            Math.max(0, Math.round(pRgb[2] * 0.82)) + ')';
        /* Surface intensity: how much the bg shifts for tabs/category headers.
           Direction is always luminance-aware: light bg → darken, dark bg → lighten.
           Presets control magnitude only. Auto picks both magnitude and direction. */
        var si = cfg.surfaceIntensity;
        var bgLuma = getLuma(bRgb);
        var darkBg = bgLuma < 0.5;

        var magnitudeMap = { subtle: 0.06, light: 0.12, medium: 0.20, strong: 0.30 };
        var magnitude;

        if (si === 'auto' || !magnitudeMap[si]) {
            /* auto — luminance-aware magnitude */
            if (bgLuma > 0.85) { magnitude = 0.10; }
            else if (bgLuma > 0.6) { magnitude = 0.12; }
            else if (bgLuma > 0.3) { magnitude = 0.15; }
            else { magnitude = 0.20; }
        } else {
            magnitude = magnitudeMap[si];
        }

        var surface;
        if (darkBg) {
            /* Lighten: blend toward white */
            surface = 'rgb(' +
                Math.min(255, Math.round(bRgb[0] + (255 - bRgb[0]) * magnitude)) + ',' +
                Math.min(255, Math.round(bRgb[1] + (255 - bRgb[1]) * magnitude)) + ',' +
                Math.min(255, Math.round(bRgb[2] + (255 - bRgb[2]) * magnitude)) + ')';
        } else {
            /* Darken: blend toward black */
            surface = 'rgb(' +
                Math.max(0, Math.round(bRgb[0] * (1 - magnitude))) + ',' +
                Math.max(0, Math.round(bRgb[1] * (1 - magnitude))) + ',' +
                Math.max(0, Math.round(bRgb[2] * (1 - magnitude))) + ')';
        }

        var privacyLink = cfg.privacyPolicyUrl
            ? ' ' + getText('about.privacyLink').replace('{link}', '<a href="' + cfg.privacyPolicyUrl + '" target="_blank" rel="noopener" style="color:var(--como-text);text-decoration:underline;">' + getText('about.privacyLinkText') + '</a>')
            : '';

        var controllerText = cfg.dataController
            ? '<p class="como-text" style="margin-top:12px;">' + getText('about.controllerText').replace('{controller}', '<strong>' + cfg.dataController + '</strong>') + privacyLink + '</p>'
            : (privacyLink ? '<p class="como-text" style="margin-top:12px;">' + privacyLink.substring(1) + '</p>' : '');

        /* Button config: determines which buttons appear on Consent and About panels */
        var btnConfig = getButtonConfig();
        var consentButtons = '';
        if (btnConfig === 'full') {
            consentButtons =
                '<button class="como-btn como-deny-btn">' + getText('buttons.denyAll') + '</button>' +
                '<button class="como-btn como-customize-btn">' + getText('buttons.customize') + '</button>' +
                '<button class="como-btn como-accept-btn">' + getText('buttons.allowAll') + '</button>';
        } else if (btnConfig === 'accept-manage') {
            consentButtons =
                '<button class="como-btn como-customize-btn">' + getText('buttons.managePreferences') + '</button>' +
                '<button class="como-btn como-accept-btn">' + getText('buttons.allowAll') + '</button>';
        } else if (btnConfig === 'notice') {
            consentButtons =
                '<button class="como-btn como-accept-btn">' + getText('buttons.allowAll') + '</button>';
        }

        /* Font: self-host or use system stack.
           To use Plus Jakarta Sans, set window.comoFontUrl to your self-hosted CSS.
           Do NOT use Google Fonts directly — it sends user IP to Google before consent. */
        var fontCSS = cfg.fontUrl ? '@import url("' + cfg.fontUrl + '");' : '';
        var fontFamily = cfg.fontUrl
            ? '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

        /* Corner radius presets: [banner, buttons/tabs, tab pills] */
        var radiusMap = { pill: ['40px', '24px', '20px'], rounded: ['20px', '12px', '9px'], soft: ['8px', '6px', '4px'], sharp: ['2px', '2px', '1px'] };
        var radii = radiusMap[cfg.cornerStyle] || radiusMap.rounded;

        var html = '<style>' +
            fontCSS +

            ':root {' +
                '--como-bg: ' + cfg.bgColor + ';' +
                '--como-btn-text: ' + btnText + ';' +
                '--como-btn-outline: ' + btnOutline + ';' +
                '--como-border-width: ' + cfg.borderWidth + ';' +
                '--como-primary: ' + cfg.primaryColor + ';' +
                '--como-text: ' + cfg.textColor + ';' +
                '--como-surface: ' + surface + ';' +
                '--como-primary-dark: ' + primaryDark + ';' +
                '--como-text-dim: ' + tRgba(0.7) + ';' +
                '--como-border: ' + tRgba(0.12) + ';' +
                '--como-border-hover: ' + tRgba(0.22) + ';' +
                '--como-radius: ' + radii[0] + ';' +
                '--como-radius-inner: ' + radii[1] + ';' +
                '--como-radius-sm: ' + radii[2] + ';' +
                '--como-font: ' + fontFamily + ';' +
            '}' +

            '#' + cfg.overlayId + ' {' +
                'position: fixed;' +
                'top: 0; left: 0;' +
                'width: 100%; height: 100%;' +
                'background: ' + pRgba(0.4) + ';' +
                'backdrop-filter: blur(8px);' +
                '-webkit-backdrop-filter: blur(8px);' +
                'z-index: 2147483646;' +
                'display: none;' +
            '}' +

            '.como-banner {' +
                'position: fixed;' +
                'top: 50%; left: 50%;' +
                'transform: translate(-50%, -50%);' +
                'width: 900px;' +
                'max-width: calc(100vw - 32px);' +
                'max-height: calc(100dvh - 32px);' +
                'background: var(--como-bg);' +
                'border-radius: var(--como-radius);' +
                'border: 1px solid var(--como-border);' +
                'font-family: var(--como-font);' +
                'z-index: 2147483647;' +
                'overflow: hidden;' +
                'display: flex;' +
                'flex-direction: column;' +
                'animation: comoPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);' +
                'box-shadow: 0 0 0 1px ' + pRgba(0.06) + ', 0 40px 80px ' + pRgba(0.18) + ', 0 0 80px rgba(239,35,60,0.06);' +
            '}' +

            '@keyframes comoPop {' +
                'from { transform: translate(-50%, -46%) scale(0.96); opacity: 0; }' +
                'to { transform: translate(-50%, -50%) scale(1); opacity: 1; }' +
            '}' +

            '.como-header {' +
                'padding: 24px 28px 0 28px;' +
                'display: flex;' +
                'align-items: center;' +
                'flex-shrink: 0;' +
            '}' +
            '.como-logo-img {' +
                'height: 36px;' +
                'width: auto;' +
                'object-fit: contain;' +
            '}' +

            '.como-close-btn {' +
                'margin-left: auto;' +
                'width: 32px;' +
                'height: 32px;' +
                'border: none;' +
                'background: transparent;' +
                'border-radius: 50%;' +
                'cursor: pointer;' +
                'position: relative;' +
                'transition: background 0.2s ease;' +
                'flex-shrink: 0;' +
            '}' +
            '.como-close-btn:hover {' +
                'background: ' + pRgba(0.08) + ';' +
            '}' +
            '.como-close-btn::before, .como-close-btn::after {' +
                'content: "";' +
                'position: absolute;' +
                'top: 50%; left: 50%;' +
                'width: 16px; height: 2px;' +
                'background: var(--como-primary);' +
                'border-radius: 1px;' +
            '}' +
            '.como-close-btn::before { transform: translate(-50%, -50%) rotate(45deg); }' +
            '.como-close-btn::after { transform: translate(-50%, -50%) rotate(-45deg); }' +

            '.como-tabs {' +
                'display: flex;' +
                'flex-shrink: 0;' +
                'margin: 20px 28px 0;' +
                'background: var(--como-surface);' +
                'border-radius: var(--como-radius-inner);' +
                'padding: 4px;' +
                'gap: 4px;' +
                'border: 1px solid var(--como-border);' +
            '}' +
            '.como-tab {' +
                'flex: 1;' +
                'padding: 10px 14px;' +
                'border: none;' +
                'background: transparent;' +
                'font-family: var(--como-font);' +
                'font-size: 13px;' +
                'font-weight: 500;' +
                'color: var(--como-text-dim);' +
                'cursor: pointer;' +
                'border-radius: var(--como-radius-sm);' +
                'transition: all 0.25s ease;' +
                'letter-spacing: 0.3px;' +
            '}' +
            '.como-tab:hover { color: var(--como-text); }' +
            '.como-tab.active {' +
                'background: var(--como-primary);' +
                'color: var(--como-btn-text);' +
                'box-shadow: 0 2px 8px ' + pRgba(0.25) + ';' +
            '}' +

            /* Outline mode: active tab also outlined */
            (cfg.buttonStyle === 'outline'
                ? '.como-tab.active {' +
                      'background: transparent;' +
                      'color: var(--como-btn-outline);' +
                      'border: var(--como-border-width) solid var(--como-btn-outline);' +
                      'box-shadow: none;' +
                  '}'
                : cfg.buttonStyle === 'filled-outline'
                ? '.como-tab.active {' +
                      'border: var(--como-border-width) solid var(--como-btn-text);' +
                  '}'
                : ''
            ) +

            '.como-content {' +
                'padding: 24px 28px;' +
                'min-height: 0;' +
                'max-height: 380px;' +
                'overflow-y: auto;' +
                'flex: 1;' +
            '}' +
            '.como-content::-webkit-scrollbar { width: 4px; }' +
            '.como-content::-webkit-scrollbar-track { background: transparent; }' +
            '.como-content::-webkit-scrollbar-thumb { background: var(--como-border); border-radius: 4px; }' +

            '.como-title {' +
                'font-family: var(--como-font);' +
                'font-size: 22px;' +
                'font-weight: 700;' +
                'color: var(--como-text);' +
                'margin-bottom: 12px;' +
                'letter-spacing: -0.3px;' +
                'line-height: 1.2;' +
            '}' +
            '.como-text {' +
                'font-size: 14px;' +
                'line-height: 1.7;' +
                'color: var(--como-text-dim);' +
                'margin-bottom: 0;' +
            '}' +

            '.como-category {' +
                'margin-bottom: 10px;' +
                'border: 1px solid var(--como-border);' +
                'border-radius: var(--como-radius-inner);' +
                'overflow: hidden;' +
                'transition: border-color 0.2s ease;' +
            '}' +
            '.como-category:hover { border-color: var(--como-border-hover); }' +
            '.como-category-header {' +
                'display: flex;' +
                'align-items: center;' +
                'justify-content: space-between;' +
                'padding: 16px 18px;' +
                'background: var(--como-surface);' +
                'cursor: pointer;' +
                'border: none;' +
                'width: 100%;' +
                'text-align: left;' +
                'font-family: var(--como-font);' +
                'transition: background 0.2s ease;' +
            '}' +
            '.como-category-header:hover { background: ' + pRgba(0.12) + '; }' +
            '.como-category-info {' +
                'display: flex;' +
                'align-items: center;' +
                'gap: 12px;' +
                'flex: 1;' +
            '}' +
            '.como-category-name {' +
                'font-family: var(--como-font);' +
                'font-weight: 600;' +
                'font-size: 14px;' +
                'color: var(--como-text);' +
                'letter-spacing: 0.2px;' +
            '}' +
            '.como-category-controls {' +
                'display: flex;' +
                'align-items: center;' +
                'gap: 14px;' +
            '}' +

            '.como-toggle {' +
                'position: relative;' +
                'width: 44px; height: 24px;' +
                'background: ' + pRgba(0.2) + ';' +
                'border-radius: 12px;' +
                'transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);' +
                'cursor: pointer;' +
                'flex-shrink: 0;' +
                'border: 1px solid transparent;' +
            '}' +
            '.como-toggle.active {' +
                'background: var(--como-primary);' +
                'border-color: ' + pRgba(0.3) + ';' +
                'box-shadow: 0 0 14px ' + pRgba(0.2) + ';' +
            '}' +
            '.como-toggle::after {' +
                'content: "";' +
                'position: absolute;' +
                'top: 2px; left: 2px;' +
                'width: 18px; height: 18px;' +
                'background: var(--como-surface);' +
                'border-radius: 50%;' +
                'transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);' +
                'box-shadow: 0 1px 4px rgba(0,0,0,0.15);' +
            '}' +
            '.como-toggle.active::after {' +
                'transform: translateX(20px);' +
                'background: var(--como-btn-text);' +
            '}' +
            '.como-toggle.disabled {' +
                'opacity: 0.4;' +
                'cursor: not-allowed;' +
            '}' +

            '.como-expand-icon {' +
                'width: 8px; height: 8px;' +
                'border: 1.5px solid var(--como-text-dim);' +
                'border-right: none;' +
                'border-top: none;' +
                'transform: rotate(-45deg);' +
                'transition: transform 0.3s ease;' +
                'flex-shrink: 0;' +
            '}' +
            '.como-category.expanded .como-expand-icon { transform: rotate(135deg); }' +

            '.como-category-content {' +
                'padding: 16px 18px;' +
                'background: var(--como-bg);' +
                'border-top: 1px solid var(--como-border);' +
                'display: none;' +
            '}' +
            '.como-category.expanded .como-category-content { display: block; }' +
            '.como-category-content p {' +
                'font-size: 13px;' +
                'line-height: 1.6;' +
                'color: var(--como-text-dim);' +
                'margin: 0;' +
            '}' +

            '.como-actions {' +
                'padding: 20px 28px 28px;' +
                'display: flex;' +
                'gap: 10px;' +
                'flex-shrink: 0;' +
            '}' +
            /* Button base — shared by all styles */
            '.como-btn {' +
                'flex: 1;' +
                'padding: 14px 22px;' +
                'border-radius: var(--como-radius-inner);' +
                'font-family: var(--como-font);' +
                'font-weight: 600;' +
                'font-size: 14px;' +
                'cursor: pointer;' +
                'transition: all 0.25s ease;' +
                'letter-spacing: 0.3px;' +
                'border: var(--como-border-width) solid transparent;' +
            '}' +

            /* Button style variants */
            (cfg.buttonStyle === 'outline'
                /* Outline: outline-colored border + text, transparent bg */
                ? '.como-btn {' +
                      'background: transparent;' +
                      'color: var(--como-btn-outline);' +
                      'border-color: var(--como-btn-outline);' +
                      'box-shadow: none;' +
                  '}' +
                  '.como-btn:hover {' +
                      'background: ' + oRgba(0.15) + ';' +
                  '}'
                : cfg.buttonStyle === 'filled-outline'
                /* Filled-outline: solid primary bg + visible btn-text border */
                ? '.como-btn {' +
                      'background: var(--como-primary);' +
                      'color: var(--como-btn-text);' +
                      'border-color: var(--como-btn-text);' +
                      'box-shadow: 0 2px 8px ' + pRgba(0.25) + ';' +
                  '}' +
                  '.como-btn:hover {' +
                      'background: var(--como-primary-dark);' +
                      'border-color: var(--como-btn-text);' +
                      'box-shadow: 0 4px 12px ' + pRgba(0.35) + ';' +
                  '}'
                /* Filled (default): solid primary bg, auto-contrast text */
                : '.como-btn {' +
                      'background: var(--como-primary);' +
                      'color: var(--como-btn-text);' +
                      'border-color: var(--como-primary);' +
                      'box-shadow: 0 2px 8px ' + pRgba(0.25) + ';' +
                  '}' +
                  '.como-btn:hover {' +
                      'background: var(--como-primary-dark);' +
                      'border-color: var(--como-primary-dark);' +
                      'box-shadow: 0 4px 12px ' + pRgba(0.35) + ';' +
                  '}'
            ) +

            '.como-panel { display: none; }' +
            '.como-panel.active {' +
                'display: flex;' +
                'flex-direction: column;' +
                'flex: 1;' +
                'min-height: 0;' +
                'overflow: hidden;' +
            '}' +

            /* Re-open consent widget */
            '#' + cfg.widgetId + ' {' +
                'position: fixed;' +
                'bottom: 20px; left: 20px;' +
                'width: 48px; height: 48px;' +
                'background: var(--como-primary);' +
                'border: 2px solid ' + pRgba(0.3) + ';' +
                'border-radius: 50%;' +
                'cursor: pointer;' +
                'z-index: 2147483645;' +
                'display: none;' +
                'align-items: center;' +
                'justify-content: center;' +
                'box-shadow: 0 4px 16px ' + pRgba(0.3) + ';' +
                'transition: transform 0.2s ease, box-shadow 0.2s ease;' +
            '}' +
            '#' + cfg.widgetId + ':hover {' +
                'transform: scale(1.08);' +
                'box-shadow: 0 6px 24px ' + pRgba(0.4) + ';' +
            '}' +
            '#' + cfg.widgetId + ' svg {' +
                'width: 22px; height: 22px;' +
                'fill: var(--como-btn-text);' +
            '}' +

            '@media (max-width: 600px) {' +
                '.como-banner {' +
                    'width: calc(100vw - 16px);' +
                    'max-height: calc(100dvh - 16px);' +
                    'border-radius: var(--como-radius);' +
                '}' +
                '.como-content { max-height: none; }' +
                '.como-header, .como-content, .como-actions {' +
                    'padding-left: 20px;' +
                    'padding-right: 20px;' +
                '}' +
                '.como-tabs { margin-left: 20px; margin-right: 20px; }' +
                '.como-actions {' +
                    'flex-direction: column;' +
                    'padding-bottom: 24px;' +
                '}' +
                '.como-btn { padding: 16px 22px; font-size: 15px; }' +
                '.como-tab { font-size: 12px; padding: 9px 10px; }' +
                '.como-title { font-size: 20px; }' +
                '.como-logo-img { height: 30px; }' +
                '#' + cfg.widgetId + ' { bottom: 16px; left: 16px; width: 44px; height: 44px; }' +
                '#' + cfg.widgetId + ' svg { width: 20px; height: 20px; }' +
            '}' +

            '@media (max-height: 500px) {' +
                '.como-content { max-height: none; }' +
                '.como-actions { gap: 6px; padding-top: 12px; padding-bottom: 16px; }' +
                '.como-btn { padding: 10px 18px; font-size: 13px; }' +
                '.como-title { font-size: 18px; }' +
                '.como-logo-img { height: 26px; }' +
                '.como-header { padding-top: 14px; padding-bottom: 10px; }' +
                '.como-tabs { margin-top: 10px; margin-bottom: 6px; }' +
                '.como-tab { padding: 7px 10px; font-size: 12px; }' +
            '}' +

            '@media (prefers-reduced-motion: reduce) {' +
                '.como-banner { animation: none; }' +
                '.como-toggle, .como-toggle::after, .como-expand-icon, .como-tab, .como-btn, .como-category, .como-category-header, .como-close-btn, #' + cfg.widgetId + ' {' +
                    'transition: none;' +
                '}' +
            '}' +
        '</style>';

        /* Build dynamic category HTML for Details panel */
        var categoriesHTML = '';
        var categories = globalConfig.categories || [];
        for (var i = 0; i < categories.length; i++) {
            var cat = categories[i];
            var catName = getText('categories.' + cat.key + '.name');
            var catDesc = getText('categories.' + cat.key + '.description');
            var isOn = cat.alwaysOn || defaults[cat.key];
            var toggleClass = isOn ? ' active' : '';
            var disabledClass = cat.alwaysOn ? ' disabled' : '';
            var ariaLabel = cat.alwaysOn
                ? getText('aria.toggleLabelAlwaysOn').replace('{name}', catName)
                : getText('aria.toggleLabel').replace('{name}', catName);

            categoriesHTML +=
                '<div class="como-category">' +
                    '<button class="como-category-header">' +
                        '<div class="como-category-info">' +
                            '<div class="como-expand-icon"></div>' +
                            '<span class="como-category-name">' + catName + '</span>' +
                        '</div>' +
                        '<div class="como-category-controls">' +
                            '<div class="como-toggle' + toggleClass + disabledClass + '" data-category="' + cat.key + '" role="switch" aria-checked="' + (isOn ? 'true' : 'false') + '" aria-label="' + ariaLabel + '" tabindex="0"></div>' +
                        '</div>' +
                    '</button>' +
                    '<div class="como-category-content">' +
                        '<p>' + catDesc + '</p>' +
                    '</div>' +
                '</div>';
        }

        /* Close button aria-label */
        var closeAriaLabel = getText('closeButton.ariaLabel');

        /* Re-open consent widget (floating cookie icon) */
        html += '<div id="' + cfg.widgetId + '" role="button" tabindex="0" aria-label="' + getText('widget.ariaLabel') + '">' +
            '<svg style="pointer-events:none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8 0-.876.141-1.718.402-2.505.054.003.108.005.163.005 1.105 0 2-.672 2-1.5S5.67 6.5 4.565 6.5c-.166 0-.327.017-.483.05A8.003 8.003 0 0 1 12 4c.076 0 .151.003.226.006C12.076 4.671 11.5 5.776 11.5 7c0 1.657 1.343 3 3 3 .728 0 1.395-.26 1.914-.691C16.776 9.77 17.5 10.469 17.5 11.5c0 1.105.895 2 2 2 .37 0 .715-.101 1.012-.276A7.997 7.997 0 0 1 12 20zM8.5 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm4 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>' +
        '</div>';

        /* Overlay */
        html += '<div id="' + cfg.overlayId + '"></div>';

        /* Banner */
        html += '<div id="' + cfg.bannerId + '" class="como-banner" role="dialog" aria-modal="true" aria-labelledby="comoTitle" style="display:none;">' +

            /* Header */
            '<div class="como-header">' +
                '<img class="como-logo-img" src="' + cfg.logoUrl + '" alt="Logo" />' +
                (model.showCloseButton ? '<button class="como-close-btn" id="comoCloseBtn" aria-label="' + closeAriaLabel + '" title="' + closeAriaLabel + '"></button>' : '') +
            '</div>' +

            /* Tabs */
            '<div class="como-tabs" role="tablist">' +
                '<button class="como-tab active" role="tab" data-tab="consent" aria-selected="true" aria-controls="consentPanel">' + getText('tabs.consent') + '</button>' +
                '<button class="como-tab" role="tab" data-tab="details" aria-selected="false" aria-controls="detailsPanel">' + getText('tabs.details') + '</button>' +
                '<button class="como-tab" role="tab" data-tab="about" aria-selected="false" aria-controls="aboutPanel">' + getText('tabs.about') + '</button>' +
            '</div>' +

            /* ── Consent Panel ── */
            '<div id="consentPanel" class="como-panel active" role="tabpanel">' +
                '<div class="como-content">' +
                    '<h5 class="como-title" id="comoTitle">' + getText('banner.title') + '</h5>' +
                    '<p class="como-text">' +
                        getText('banner.description') +
                        privacyLink +
                    '</p>' +
                '</div>' +
                '<div class="como-actions">' +
                    consentButtons +
                '</div>' +
            '</div>' +

            /* ── Details Panel (dynamic categories) ── */
            '<div id="detailsPanel" class="como-panel" role="tabpanel">' +
                '<div class="como-content">' +
                    categoriesHTML +
                '</div>' +
                '<div class="como-actions">' +
                    '<button class="como-btn como-deny-btn">' + getText('buttons.denyAll') + '</button>' +
                    '<button id="comoAllowBtn" class="como-btn">' + getText('buttons.allowSelection') + '</button>' +
                '</div>' +
            '</div>' +

            /* ── About Panel ── */
            '<div id="aboutPanel" class="como-panel" role="tabpanel">' +
                '<div class="como-content">' +
                    '<h5 class="como-title">' + getText('about.title') + '</h5>' +
                    '<p class="como-text">' +
                        getText('about.description') +
                    '</p>' +
                    controllerText +
                '</div>' +
                '<div class="como-actions">' +
                    consentButtons +
                '</div>' +
            '</div>' +

        '</div>';

        return html;
    }

    /* ═══════════════════════════════════════════════
       INITIALIZE BANNER & BIND EVENTS
       All events use addEventListener (CSP-safe)
       ═══════════════════════════════════════════════ */

    function initializeBanner() {
        var body = document.body;
        if (!body) { setTimeout(initializeBanner, 100); return; }
        if (document.getElementById(cfg.bannerId)) return;

        var ready = 0;
        var needed = 2; // config + region; may become 3 if lang file needed
        function onReady() {
            ready++;
            if (ready < needed) return;
            /* Config, region, and language (if needed) are all resolved — proceed */

            if (!validateConfig(globalConfig)) {
                console.warn('[CoMo Banner] Invalid config — using fallback');
                globalConfig = FALLBACK_CONFIG;
            }

            /* Fire correct consent defaults based on region config.
               Standalone mode: single consent,default call (no pessimistic-then-update).
               GTM mode: defaults already set by template (all denied + wait_for_update).
               Banner only fires consent,update for non-strict regions (opt-out/gpc). */
            var defaults = getEffectiveDefaults();
            if (!window.comoGtmManaged) {
                var defaultState = buildConsentModeState(defaults);
                defaultState.wait_for_update = 500;
                gtag('consent', 'default', defaultState);
            } else {
                var existingCookie = readCookie(cfg.cookieName);
                if (!existingCookie) {
                    var needsUpdate = defaults.preferences || defaults.analytics || defaults.marketing;
                    if (needsUpdate) {
                        updateConsentMode(defaults);
                    }
                }
            }
            consentState.permissions = defaults;

            /* ── "none" model: auto-grant silently, no UI ── */
            var mode = getMode();
            if (mode.showBanner === false) {
                var allGranted = { necessary: true, preferences: true, analytics: true, marketing: true };
                var existingNone = readCookie(cfg.cookieName);
                if (existingNone) {
                    try {
                        var parsedNone = JSON.parse(existingNone);
                        if (parsedNone.version === consentState.version) {
                            consentState = parsedNone;
                            window.comoConsent = consentState;
                            sendConsentEvents('existing', parsedNone.permissions);
                            return;
                        }
                    } catch (e) { /* re-grant below */ }
                }
                consentState.permissions = allGranted;
                consentState.explicitConsent = false;
                window.comoConsent = consentState;
                var autoGrantExpiry = getConsentExpiry();
                setCookie(cfg.cookieName, JSON.stringify({
                    version: consentState.version,
                    permissions: allGranted,
                    explicitConsent: false,
                    timestamp: new Date().toISOString(),
                    region: cfg.region,
                    gpcApplied: false
                }), autoGrantExpiry);
                setCookie(GEO_COOKIE_NAME, cfg.region, autoGrantExpiry);
                sendConsentEvents('auto-grant', allGranted);
                return;
            }

            var container = document.createElement('div');
            container.innerHTML = createBannerHTML();
            body.appendChild(container);

            /* ── Close button ── */
            var closeBtn = document.getElementById('comoCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function () { handleConsent('accept-all'); });
            }

            /* ── Tab buttons ── */
            var tabBtns = container.querySelectorAll('.como-tab');
            for (var t = 0; t < tabBtns.length; t++) {
                tabBtns[t].addEventListener('click', (function (btn) {
                    return function () {
                        switchTab(btn.getAttribute('data-tab'));
                        for (var a = 0; a < tabBtns.length; a++) {
                            tabBtns[a].setAttribute('aria-selected', tabBtns[a] === btn ? 'true' : 'false');
                        }
                    };
                })(tabBtns[t]));
            }

            /* ── Deny all buttons ── */
            var denyBtns = container.querySelectorAll('.como-deny-btn');
            for (var d = 0; d < denyBtns.length; d++) {
                denyBtns[d].addEventListener('click', function () { handleConsent('deny-all'); });
            }

            /* ── Accept all buttons ── */
            var acceptBtns = container.querySelectorAll('.como-accept-btn');
            for (var a = 0; a < acceptBtns.length; a++) {
                acceptBtns[a].addEventListener('click', function () { handleConsent('accept-all'); });
            }

            /* ── Customize buttons ── */
            var customBtns = container.querySelectorAll('.como-customize-btn');
            for (var c = 0; c < customBtns.length; c++) {
                customBtns[c].addEventListener('click', function () { switchTab('details'); });
            }

            /* ── Category headers (expand/collapse) ── */
            var headers = container.querySelectorAll('.como-category-header');
            for (var h = 0; h < headers.length; h++) {
                headers[h].addEventListener('click', function (e) {
                    if (e.target.classList.contains('como-toggle')) return;
                    toggleCategory(this);
                });
            }

            /* ── Toggle switches ── */
            var toggles = container.querySelectorAll('.como-toggle');
            for (var g = 0; g < toggles.length; g++) {
                toggles[g].addEventListener('click', function (e) {
                    toggleSwitch(this, e);
                });
                toggles[g].addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSwitch(this, e);
                    }
                });
            }

            /* ── Allow selection / Allow all button (details panel) ── */
            var allowBtn = document.getElementById('comoAllowBtn');
            if (allowBtn) {
                allowBtn._consentType = 'selected';
                allowBtn.addEventListener('click', function () {
                    handleConsent(this._consentType || 'selected');
                });
            }

            /* ── Re-open widget ── */
            var widget = document.getElementById(cfg.widgetId);
            if (widget) {
                widget.addEventListener('click', function () {
                    showBanner();
                    switchTab('consent');
                });
                widget.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        showBanner();
                        switchTab('consent');
                    }
                });
            }

            /* Initialize toggle button text based on default states */
            updateAllowBtn();

            /* Check for existing consent or show banner */
            checkExistingConsent();
        } /* end onReady */

        /* Config loads first, then triggers language loading if needed */
        function onConfigLoaded() {
            resolvedLang = resolveLanguage();
            if (resolvedLang !== 'en') {
                needed = 3; // need a third ready signal for language file
                loadLanguage(resolvedLang, onReady);
            }
            onReady(); // signal config done
        }

        loadConfig(onConfigLoaded);
        resolveRegion(onReady);
    }

    /* ═══════════════════════════════════════════════
       PUBLIC API
       ═══════════════════════════════════════════════ */

    window.comoConsentAPI = {
        showBanner: function () {
            showBanner();
            switchTab('consent');
        },
        getConsent: function () {
            return window.comoConsent ? window.comoConsent.permissions : null;
        },
        getRegion: function () {
            return cfg.region;
        },
        getLanguage: function () {
            return resolvedLang;
        },
        getMode: function () {
            return getModelName();
        },
        isGpcEnabled: isGpcEnabled,
        updateConsent: function (permissions) {
            if (permissions && typeof permissions === 'object') {
                permissions.necessary = true;
                consentState.permissions = Object.assign({}, consentState.permissions, permissions);
                window.comoConsent = consentState;
                var apiExpiry = getConsentExpiry();
                setCookie(cfg.cookieName, JSON.stringify({
                    version: consentState.version,
                    permissions: consentState.permissions,
                    explicitConsent: true,
                    timestamp: new Date().toISOString(),
                    region: cfg.region,
                    gpcApplied: isGpcEnabled()
                }), apiExpiry);
                setCookie(GEO_COOKIE_NAME, cfg.region, apiExpiry);
                sendConsentEvents('api_update', consentState.permissions);
                logConsent('api_update', consentState.permissions);
            }
        },
        resetConsent: function () {
            setCookie(cfg.cookieName, '', -1);
            showBanner();
            switchTab('consent');
            hideWidget();
        }
    };

    /* ═══════════════════════════════════════════════
       INIT
       ═══════════════════════════════════════════════ */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeBanner);
    } else {
        initializeBanner();
    }

})();
