/*!
 * CoMo Banner v1.x — Cookie Consent Management
 * Copyright (c) 2025–2026 Voxxy Creative Lab Limited. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * modification, distribution, or use of this file, via any medium, is
 * strictly prohibited without the express written permission of
 * Voxxy Creative Lab Limited.
 *
 * For licensing inquiries: hello@voxxycreativelab.com
 */
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
       window.comoWidgetPosition  = 'left';      // widget position: 'left' or 'right'
       window.comoWidgetLogoUrl   = '';           // override widget logo (URL to image)
       window.comoWidgetBgColor   = '#0b4650';   // widget background color
       window.comoWidgetContentColor = '#e6ff2b'; // widget icon & border color
       window.comoAgencyLogoUrl   = '';           // agency badge logo (replaces Voxxy badge)
       window.comoAgencyUrl       = '';           // agency website URL (replaces Voxxy URL)
       ═══════════════════════════════════════════════ */

    /* Voxxy Creative Lab — brand palette (used by tiered branding) */
    var VOXXY = {
        cream:  '#f9f7f2',
        red:    '#ef233c',
        neon:   '#e6ff2b',
        teal:   '#0b4650',
        white:  '#fefdfc'
    };

    var VOXXY_BADGE_LOGO = 'https://cdn.jsdelivr.net/gh/VoxxyCreativeLab/cdn-como-banner@v1/assets/voxxy-badge-logo.svg';
    var VOXXY_URL = 'https://voxxycreativelab.com';
    var isAgency = (window.comoAgencyLogoUrl !== undefined);

    var cfg = {
        version: '1',
        cookieName: 'vcl_consent',
        bannerId: 'comoBanner',
        overlayId: 'comoOverlay',
        widgetId: 'comoWidget',
        containerId: 'comoContainer',
        region: 'unknown',
        privacyPolicyUrl: window.comoPrivacyUrl || '',
        dataController: window.comoDataController || '',
        logoUrl: window.comoLogoUrl || '',
        fontUrl: window.comoFontUrl || '',
        logEndpoint: window.comoLogEndpoint || '',
        primaryColor: window.comoPrimaryColor || '#0b4650',
        // accentColor removed — button text is auto-computed from primary luminance
        bgColor: window.comoBgColor || '#f9f7f2',
        textColor: window.comoTextColor || '#0b4650',
        showOverlay: !window.comoDisableOverlay,
        buttonStyle: window.comoButtonStyle || 'filled',
        buttonTextColor: window.comoButtonTextColor || '#e6ff2b',
        borderWidth: window.comoBorderWidth || '2px',
        cornerStyle: window.comoCornerStyle || 'rounded',
        surfaceIntensity: window.comoSurfaceIntensity || 'auto',
        widgetPosition: window.comoWidgetPosition || 'left',
        widgetLogoUrl: window.comoWidgetLogoUrl || '',
        widgetBgColor: window.comoWidgetBgColor || '#0b4650',
        widgetContentColor: window.comoWidgetContentColor || '#e6ff2b',
        agencyLogoUrl: window.comoAgencyLogoUrl || '',
        agencyUrl: window.comoAgencyUrl || '',
        badgeLogoUrl: window.comoBadgeLogoUrl || ''
    };

    /* Auto-included in Necessary: banner's own cookies */
    var AUTO_NECESSARY_COOKIES = [
        { name: 'vcl_consent', category: 'necessary', provider: 'CoMo Banner', duration: '1 year', purpose: 'Stores your cookie consent preferences' },
        { name: 'vcl_geo', category: 'necessary', provider: 'CoMo Banner', duration: '30 days', purpose: 'Caches your detected geographic region' }
    ];
    var customCookies = window.comoCustomCookies || [];
    var detectedCookies = [];

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
                aria: { toggleLabel: '{name} cookies', toggleLabelAlwaysOn: '{name} cookies (always active)' },
                cookieTable: { name: 'Name', purpose: 'Purpose', duration: 'Duration', provider: 'Provider' }
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

    /* Focus management: track element focused before banner opened (WCAG 2.4.3) */
    var lastFocusedElement = null;

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
        var allDenied = !permissions.analytics && !permissions.marketing && !permissions.preferences;
        var allGranted = permissions.analytics && permissions.marketing && permissions.preferences;
        var consentOutcome;
        if (type === 'existing') { consentOutcome = 'existing'; }
        else if (type === 'auto-grant') { consentOutcome = 'auto_grant'; }
        else if (type === 'accept-all') { consentOutcome = 'granted_all'; }
        else if (type === 'deny-all') { consentOutcome = 'denied_all'; }
        else if (type === 'dnsmpi') { consentOutcome = 'do_not_sell'; }
        else if (allDenied) { consentOutcome = 'denied_all'; }
        else if (allGranted) { consentOutcome = 'granted_all'; }
        else { consentOutcome = 'partial'; }
        setTimeout(function () {
            dataLayer.push({
                'event': 'cookie_consent_update',
                'consentType': type,
                'consent_outcome': consentOutcome,
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
        if (type === 'dnsmpi') {
            permissions.analytics = false;
            permissions.marketing = false;
        }

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
            /* WCAG 2.4.3: save current focus so we can restore it on close */
            lastFocusedElement = document.activeElement;

            banner.style.display = '';
            if (!dvhSupported) fixBannerHeight();
            if (cfg.showOverlay) {
                overlay.style.display = 'block';
                document.documentElement.classList.add('como-blur');
            }
            hideWidget();

            /* WCAG 1.3.1: mark background inert so screen readers stay inside the dialog */
            var bodyChildren = document.body.children;
            for (var bi = 0; bi < bodyChildren.length; bi++) {
                if (bodyChildren[bi].id !== cfg.containerId) {
                    bodyChildren[bi].setAttribute('inert', '');
                }
            }

            /* WCAG 2.4.3: move keyboard focus to the Consent tab */
            setTimeout(function () {
                var consentTab = banner.querySelector('.como-tab[data-tab="consent"]');
                if (consentTab) consentTab.focus({ focusVisible: true });
            }, 50);

            /* WCAG 4.1.3: announce banner title to screen readers */
            var liveRegion = document.getElementById('comoLiveRegion');
            if (liveRegion) {
                var bannerTitle = document.getElementById('comoTitle');
                liveRegion.textContent = bannerTitle ? bannerTitle.textContent : '';
            }

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
                updateDetailsBtns();
            }
        }
    }

    function closeBanner() {
        var banner = document.getElementById(cfg.bannerId);
        var overlay = document.getElementById(cfg.overlayId);
        if (banner && overlay) {
            banner.style.display = 'none';
            if (cfg.showOverlay) {
                overlay.style.display = 'none';
                document.documentElement.classList.remove('como-blur');
            }

            /* WCAG 1.3.1: remove inert from page background */
            var bodyChildren = document.body.children;
            for (var bi = 0; bi < bodyChildren.length; bi++) {
                bodyChildren[bi].removeAttribute('inert');
            }

            /* WCAG 4.1.3: clear live region */
            var liveRegion = document.getElementById('comoLiveRegion');
            if (liveRegion) liveRegion.textContent = '';

            /* WCAG 2.4.3: restore focus to element that was active before banner opened */
            if (lastFocusedElement && lastFocusedElement.focus) {
                lastFocusedElement.focus();
            } else {
                var widget = document.getElementById(cfg.widgetId);
                if (widget) widget.focus({ focusVisible: true });
            }
            lastFocusedElement = null;
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
        updateDetailsBtns();
    }

    function updateDetailsBtns() {
        var toggles = document.querySelectorAll('.como-toggle:not(.disabled)');
        var allActive = true;
        var noneActive = true;
        for (var i = 0; i < toggles.length; i++) {
            if (!toggles[i].classList.contains('active')) { allActive = false; }
            if (toggles[i].classList.contains('active')) { noneActive = false; }
        }
        if (getModelName() === 'opt-in') {
            /* 3-button layout: enable "Allow selection" when any non-necessary toggle is on */
            var selBtn = document.getElementById('comoAllowSelBtn');
            if (selBtn) selBtn.disabled = noneActive;
        } else {
            /* opt-out / opt-out-gpc: dynamic left button */
            var denySelBtn = document.getElementById('comoDenySelBtn');
            if (!denySelBtn) return;
            denySelBtn.textContent = noneActive ? getText('buttons.denyAll') : getText('buttons.allowSelection');
            denySelBtn._consentType = noneActive ? 'deny-all' : 'selected';
        }
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
       COOKIE DECLARATIONS
       Detect known services and build declaration tables.
       ═══════════════════════════════════════════════ */

    function detectKnownServices() {
        var knownServices = globalConfig.knownCookies || [];
        var result = [];
        var scripts = document.getElementsByTagName('script');

        for (var i = 0; i < knownServices.length; i++) {
            var svc = knownServices[i];
            var detected = false;

            // Check 1: window global exists
            if (svc.scriptGlobal && typeof window[svc.scriptGlobal] !== 'undefined') {
                detected = true;
            }

            // Check 2: script src pattern match (works in opt-in before execution)
            if (!detected && svc.scriptSrc) {
                for (var j = 0; j < scripts.length; j++) {
                    var src = scripts[j].src || '';
                    if (src.indexOf(svc.scriptSrc) !== -1) {
                        detected = true;
                        break;
                    }
                }
            }

            if (detected) {
                for (var k = 0; k < svc.cookies.length; k++) {
                    result.push(svc.cookies[k]);
                }
            }
        }

        detectedCookies = result;
    }

    function getCookiesForCategory(categoryKey) {
        var result = [];

        // Layer 1: AUTO_NECESSARY_COOKIES (only for 'necessary')
        if (categoryKey === 'necessary') {
            for (var i = 0; i < AUTO_NECESSARY_COOKIES.length; i++) {
                result.push(AUTO_NECESSARY_COOKIES[i]);
            }
        }

        // Layer 2: detected cookies from knownCookies
        for (var j = 0; j < detectedCookies.length; j++) {
            if (detectedCookies[j].category === categoryKey) {
                result.push(detectedCookies[j]);
            }
        }

        // Layer 3: custom cookies from GTM template field
        for (var k = 0; k < customCookies.length; k++) {
            if ((customCookies[k].category || '').toLowerCase() === categoryKey) {
                result.push(customCookies[k]);
            }
        }

        return result;
    }

    function buildCookieTableHTML(cookies) {
        if (!cookies || cookies.length === 0) return '';

        var html = '<div class="como-cookie-table-wrap">' +
            '<table class="como-cookie-table">' +
            '<thead><tr>' +
            '<th>' + getText('cookieTable.name') + '</th>' +
            '<th>' + getText('cookieTable.purpose') + '</th>' +
            '<th>' + getText('cookieTable.duration') + '</th>' +
            '<th>' + getText('cookieTable.provider') + '</th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i];
            html += '<tr>' +
                '<td>' + (c.name || '') + '</td>' +
                '<td>' + (c.purpose || '') + '</td>' +
                '<td>' + (c.duration || '') + '</td>' +
                '<td>' + (c.provider || '') + '</td>' +
                '</tr>';
        }

        html += '</tbody></table></div>';
        return html;
    }

    /* ═══════════════════════════════════════════════
       BUILD BANNER HTML
       Text and categories driven by globalConfig.
       Language resolved via resolveLanguage() with
       per-key English fallback.
       ═══════════════════════════════════════════════ */

    function getDnsmpiLinkHtml() {
        if (getModelName() !== 'opt-out-gpc') return '';
        return '<div class="como-dnsmpi">' +
            '<button class="como-dnsmpi-btn">' + getText('buttons.doNotSell') + '</button>' +
            '</div>';
    }

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
        /* Widget glow: content color on dark widget bg (bright glow), widget bg on light (dark shadow) */


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
                '<button class="como-btn como-accept-btn">' + getText('buttons.allowAll') + '</button>' +
                '<button class="como-btn como-customize-btn">' + getText('buttons.customize') + '</button>' +
                '<button class="como-btn como-deny-btn">' + getText('buttons.denyAll') + '</button>';
        } else if (btnConfig === 'accept-manage') {
            consentButtons =
                '<button class="como-btn como-accept-btn">' + getText('buttons.allowAll') + '</button>' +
                '<button class="como-btn como-btn-secondary como-customize-btn">' + getText('buttons.managePreferences') + '</button>';
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
                '--como-widget-bg: ' + cfg.widgetBgColor + ';' +
                '--como-widget-content: ' + cfg.widgetContentColor + ';' +
            '}' +

            'html.como-blur > body > *:not(#' + cfg.containerId + ') {' +
                'filter: blur(4px);' +
                'transition: filter 0.2s ease;' +
            '}' +

            '#' + cfg.overlayId + ' {' +
                'position: fixed;' +
                'top: 0; left: 0;' +
                'width: 100%; height: 100%;' +
                'background: ' + pRgba(0.4) + ';' +
                'z-index: 2147483646;' +
                'display: none;' +
            '}' +

            '/* CSS isolation — block host page interference */' +
            '.como-banner, .como-banner *, .como-banner *::before, .como-banner *::after {' +
                'all: revert;' +
                'box-sizing: border-box;' +
            '}' +

            '.como-banner {' +
                'text-align: left;' +
                'color: var(--como-text);' +
                'font-size: 16px;' +
                'line-height: 1.5;' +
                'letter-spacing: normal;' +
                'word-spacing: normal;' +
                'text-transform: none;' +
                'text-indent: 0;' +
                'white-space: normal;' +
                'font-style: normal;' +
                'font-weight: 400;' +
                'text-decoration: none;' +
                'visibility: visible;' +
                'direction: ltr;' +
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
                'justify-content: space-between;' +
                'flex-shrink: 0;' +
            '}' +
            '.como-logo-img {' +
                'height: 36px;' +
                'width: auto;' +
                'object-fit: contain;' +
            '}' +
            '.como-header-right {' +
                'display: flex;' +
                'align-items: center;' +
                'gap: 12px;' +
                'margin-left: auto;' +
            '}' +
            '.como-badge {' +
                'display: flex;' +
                'flex-direction: column;' +
                'align-items: flex-end;' +
                'text-decoration: none;' +
                'gap: 2px;' +
                'flex-shrink: 0;' +
            '}' +
            '.como-badge-text {' +
                'font-size: 9px;' +
                'color: var(--como-text);' +
                'opacity: 0.6;' +
                'line-height: 1;' +
                'font-family: var(--como-font);' +
            '}' +
            '.como-badge-logo {' +
                'height: 20px;' +
                'width: auto;' +
                'object-fit: contain;' +
            '}' +
            '.como-badge-mono {' +
                'display: inline-block;' +
                'width: 60px;' +
                'background-color: var(--como-text);' +
                '-webkit-mask-size: contain;' +
                'mask-size: contain;' +
                '-webkit-mask-repeat: no-repeat;' +
                'mask-repeat: no-repeat;' +
                '-webkit-mask-position: center;' +
                'mask-position: center;' +
            '}' +

            '.como-close-btn {' +
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
            '.como-tab:hover { color: var(--como-text); background: ' + tRgba(0.08) + '; }' +
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
                'overscroll-behavior: contain;' +
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
                'border: 1px solid var(--como-border);' +
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
            (cfg.buttonStyle === 'outline'
                ? '.como-toggle.active::after { background: var(--como-bg); }'
                : ''
            ) +
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

            '.como-cookie-table-wrap {' +
                'overflow-x: auto;' +
                'margin-top: 12px;' +
                '-webkit-overflow-scrolling: touch;' +
            '}' +
            '.como-cookie-table {' +
                'width: 100%;' +
                'border-collapse: collapse;' +
                'font-size: 12px;' +
                'font-family: var(--como-font);' +
                'color: var(--como-text-dim);' +
                'line-height: 1.5;' +
            '}' +
            '.como-cookie-table th {' +
                'text-align: left;' +
                'font-weight: 600;' +
                'font-size: 11px;' +
                'text-transform: uppercase;' +
                'letter-spacing: 0.3px;' +
                'color: var(--como-text);' +
                'padding: 8px 10px;' +
                'border-bottom: 2px solid var(--como-border);' +
                'white-space: nowrap;' +
            '}' +
            '.como-cookie-table td {' +
                'padding: 6px 10px;' +
                'border-bottom: 1px solid var(--como-border);' +
                'vertical-align: top;' +
            '}' +
            '.como-cookie-table tr:last-child td {' +
                'border-bottom: none;' +
            '}' +
            '.como-cookie-table td:first-child {' +
                'font-family: monospace, var(--como-font);' +
                'font-size: 11px;' +
                'white-space: nowrap;' +
            '}' +

            '.como-actions {' +
                'padding: 20px 28px 28px;' +
                'display: flex;' +
                'flex-direction: row-reverse;' +
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
            '.como-btn:disabled {' +
                'opacity: 0.35;' +
                'cursor: default;' +
                'pointer-events: none;' +
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

            /* Secondary button: outline style for non-primary actions in opt-out regions.
               Filled style: use primary color (ghost of the filled button).
               Outline/filled-outline: use btn-outline color (consistent with overall style). */
            (btnConfig !== 'full'
                ? (function () {
                      var secColor = cfg.buttonStyle === 'filled' ? 'var(--como-primary)' : 'var(--como-btn-outline)';
                      var secHover = cfg.buttonStyle === 'filled' ? pRgba(0.1) : oRgba(0.1);
                      return '.como-btn-secondary {' +
                          'background: transparent !important;' +
                          'color: ' + secColor + ' !important;' +
                          'border-color: ' + secColor + ' !important;' +
                          'box-shadow: none !important;' +
                      '}' +
                      '.como-btn-secondary:hover {' +
                          'background: ' + secHover + ' !important;' +
                      '}';
                  })()
                : '') +

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
                'bottom: 12px; ' + cfg.widgetPosition + ': 12px;' +
                'width: 40px; height: 40px;' +
                'background: var(--como-widget-bg);' +
                'border: 1px solid var(--como-widget-content);' +
                'border-radius: 50%;' +
                'cursor: pointer;' +
                'z-index: 2147483645;' +
                'display: none;' +
                'align-items: center;' +
                'justify-content: center;' +
                'overflow: visible;' +
                'transform: translateZ(0);' +
                'transition: transform 0.2s ease;' +
            '}' +
            '#' + cfg.widgetId + ':hover {' +
                'transform: scale(1.08) translateZ(0);' +
            '}' +
            '#' + cfg.widgetId + ' svg {' +
                'width: 60%; height: 60%;' +
                'display: block;' +
                'fill: var(--como-widget-content);' +
            '}' +

            '@media (max-width: 600px) {' +
                '.como-banner {' +
                    'width: calc(100vw - 16px);' +
                    'max-height: calc(100dvh - 16px);' +
                    'border-radius: var(--como-radius);' +
                '}' +
                '.como-content { max-height: none; }' +
                '.como-header, .como-content, .como-actions, .como-dnsmpi {' +
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
                '.como-badge-logo { height: 16px; }' +
                '.como-badge-mono { width: 48px; }' +
                '.como-badge-text { font-size: 8px; }' +
                '#' + cfg.widgetId + ' { bottom: 12px; ' + cfg.widgetPosition + ': 12px; width: 36px; height: 36px; }' +
            '}' +

            '@media (max-height: 500px) {' +
                '.como-content { max-height: none; padding-top: 16px; padding-bottom: 16px; }' +
                '.como-actions { gap: 6px; padding-top: 8px; padding-bottom: 12px; }' +
                '.como-btn { padding: 8px 16px; font-size: 13px; }' +
                '.como-title { font-size: 16px; margin-bottom: 8px; }' +
                '.como-logo-img { height: 22px; }' +
                '.como-badge-logo { height: 14px; }' +
                '.como-badge-mono { width: 42px; }' +
                '.como-badge-text { font-size: 7px; }' +
                '.como-header { padding-top: 10px; padding-bottom: 6px; }' +
                '.como-tabs { margin-top: 6px; margin-bottom: 4px; }' +
                '.como-tab { padding: 5px 8px; font-size: 12px; }' +
            '}' +

            '@media (prefers-reduced-motion: reduce) {' +
                '.como-banner { animation: none; }' +
                '.como-toggle, .como-toggle::after, .como-expand-icon, .como-tab, .como-btn, .como-category, .como-category-header, .como-close-btn, #' + cfg.widgetId + ' {' +
                    'transition: none;' +
                '}' +
            '}' +

            '.como-dnsmpi {' +
                'text-align: center;' +
                'padding: 8px 28px 4px;' +
                'flex-shrink: 0;' +
            '}' +
            '.como-dnsmpi-btn {' +
                'background: none;' +
                'border: none;' +
                'padding: 0;' +
                'font-size: 11px;' +
                'text-decoration: underline;' +
                'color: var(--como-text);' +
                'opacity: 0.55;' +
                'cursor: pointer;' +
                'font-family: var(--como-font);' +
                'line-height: 1.4;' +
            '}' +
            '.como-dnsmpi-btn:hover { opacity: 1; }' +

            /* Base reset: suppress all browser-default focus rings inside banner */
            '#' + cfg.bannerId + ' button,' +
            '#' + cfg.bannerId + ' a,' +
            '#' + cfg.bannerId + ' [tabindex="0"],' +
            '#' + cfg.widgetId + ',' +
            '#' + cfg.bannerId + ' button:focus,' +
            '#' + cfg.bannerId + ' a:focus,' +
            '#' + cfg.bannerId + ' [tabindex="0"]:focus,' +
            '#' + cfg.widgetId + ':focus {' +
                'outline: none;' +
            '}' +

            /* WCAG 2.4.7: Visible focus ring for keyboard navigation only */
            '#' + cfg.bannerId + ' button:focus-visible,' +
            '#' + cfg.bannerId + ' .como-badge:focus-visible,' +
            '#' + cfg.bannerId + ' .como-toggle:focus-visible,' +
            '#' + cfg.widgetId + ':focus-visible {' +
                'outline: 3px solid ' + cfg.primaryColor + ';' +
                'outline-offset: 2px;' +
            '}' +

            /* Visually-hidden helper for aria-live region (WCAG 4.1.3) */
            '.como-sr-only {' +
                'position: absolute;' +
                'width: 1px; height: 1px;' +
                'padding: 0; overflow: hidden;' +
                'clip: rect(0,0,0,0);' +
                'white-space: nowrap; border: 0;' +
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
                        buildCookieTableHTML(getCookiesForCategory(cat.key)) +
                    '</div>' +
                '</div>';
        }

        /* Close button aria-label */
        var closeAriaLabel = getText('closeButton.ariaLabel');

        /* WCAG 4.1.3: Screen reader announcement region — visually hidden, updated on showBanner() */
        html += '<div id="comoLiveRegion" aria-live="polite" aria-atomic="true" class="como-sr-only"></div>';

        /* Re-open consent widget (floating Voxxy logo) */
        var widgetIcon = cfg.widgetLogoUrl
            ? '<img style="pointer-events:none;width:70%;height:70%;" src="' + cfg.widgetLogoUrl + '" alt="Manage cookies" />'
            : '<svg style="pointer-events:none" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10.9,8.8H9.2L8.5,10H7.1l-1.1,1.9l0.3,0.6l-0.9,1.6l0.7,1.1l-0.7,1.1l1,1.6l-0.4,0.6l1.1,1.8h1.4l0.7,1.2h1.7l0.8-1.4v-9.7L10.9,8.8z M9.4,9.3h1.2l0.6,1.1v1.7l-2.3-1.9l0,0L9.4,9.3z M11.2,17.5l-3.7,0.1l3.7-2.1V17.5z M11.2,14.8l-3.7-2.1l3.7,0.1V14.8z M7.4,10.5h1.1l2.3,1.8l-4-0.1l0,0l-0.2-0.3L7.4,10.5z M6.1,14.1l0.7-1.2l0,0l3.8,2.1h-4L6.1,14.1z M6.1,16.3l0.5-0.9h4l-3.8,2.1L6.1,16.3z M6.6,18.4L6.8,18l0,0l4-0.1l-2.3,1.8H7.4L6.6,18.4z M10.6,21H9.4l-0.5-0.9l0,0l2.3-1.9v1.7L10.6,21z"/><path d="M19.1,9.5c-1.1-1.5-2.7-2.6-4.5-3.2V1.7h0.9V0H8.4v1.7h0.9v4.7C7.5,6.9,6,8,4.9,9.5C3.7,11.1,3.1,13,3.1,15c0,5,4.1,9,9,9s9-4.1,9-9C21,13,20.3,11.1,19.1,9.5 M12,23.5c-4.7,0-8.5-3.9-8.5-8.5c0-3.8,2.5-7.1,6.1-8.1h0.2V1.3H8.9V0.5h6.2v0.8h-0.9v5.5h0.2c3.6,1.1,6,4.5,6,8.1C20.5,19.6,16.7,23.5,12,23.5"/><rect x="8.8" y="1.3" width="6.3" height="0.4"/><path d="M17.8,15.2l0.7-1.1l-0.9-1.6l0.3-0.6l-1.1-1.8h-1.4l-0.7-1.2H13l-0.8,1.4V20l0.8,1.4h1.7l0.7-1.2h1.4l1.1-1.8l-0.3-0.6l0.9-1.6L17.8,15.2z M13.6,9.3h0.9v0.9h-0.9V9.3z M13.2,12.1h0.7v0.7h-0.7V12.1z M14.7,15h-1.4v-1.4h1.4V15z M15.3,11.7h-0.9v-0.8h0.9V11.7z M16.1,10.5h0.7v0.7h-0.7V10.5z M16.4,13.4h-0.9v-0.9h0.9V13.4z M17.4,14.2h-0.6v-0.6h0.6V14.2z"/><rect x="15.7" y="8.4" width="1.2" height="1.2"/><rect x="16.7" y="5.9" width="0.9" height="0.9"/><rect x="14.3" y="7.5" width="0.9" height="0.9"/></svg>';
        html += '<div id="' + cfg.widgetId + '" role="button" tabindex="0" aria-label="' + getText('widget.ariaLabel') + '">' +
            widgetIcon +
        '</div>';

        /* Badge: tier-aware logo selection */
        var showBadge, badgeLogoUrl, badgeMono;
        if (cfg.agencyLogoUrl) {
            /* Agency with custom logo — render in text color via mask */
            showBadge = true;
            badgeLogoUrl = cfg.agencyLogoUrl;
            badgeMono = true;
        } else if (isAgency) {
            /* Agency without custom logo — hide badge entirely */
            showBadge = false;
        } else if (cfg.badgeLogoUrl) {
            /* Free — colored Voxxy logo (set by template), show as-is */
            showBadge = true;
            badgeLogoUrl = cfg.badgeLogoUrl;
            badgeMono = false;
        } else {
            /* Pro — monochrome Voxxy badge, render in text color via mask */
            showBadge = true;
            badgeLogoUrl = VOXXY_BADGE_LOGO;
            badgeMono = true;
        }

        /* Overlay */
        html += '<div id="' + cfg.overlayId + '"></div>';

        /* Banner */
        html += '<div id="' + cfg.bannerId + '" class="como-banner" role="dialog" aria-modal="true" aria-labelledby="comoTitle" style="display:none;">' +

            /* Header */
            '<div class="como-header">' +
                (cfg.logoUrl ? '<img class="como-logo-img" src="' + cfg.logoUrl + '" alt="Logo" />' : '') +
                '<div class="como-header-right">' +
                    (showBadge
                        ? '<a class="como-badge" href="' + (cfg.agencyUrl || VOXXY_URL) + '" target="_blank" rel="noopener noreferrer" aria-label="Privacy by ' + (cfg.agencyUrl ? cfg.agencyUrl.replace(/^https?:\/\//, '') : 'Voxxy Creative Lab') + '">' +
                              '<span class="como-badge-text">Privacy by</span>' +
                              (badgeMono
                                  ? '<span class="como-badge-logo como-badge-mono" aria-hidden="true" style="-webkit-mask-image:url(' + badgeLogoUrl + ');mask-image:url(' + badgeLogoUrl + ');"></span>'
                                  : '<img class="como-badge-logo" src="' + badgeLogoUrl + '" alt="" />') +
                          '</a>'
                        : '') +
                    (model.showCloseButton ? '<button class="como-close-btn" id="comoCloseBtn" aria-label="' + closeAriaLabel + '" title="' + closeAriaLabel + '"></button>' : '') +
                '</div>' +
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
                getDnsmpiLinkHtml() +
            '</div>' +

            /* ── Details Panel (dynamic categories) ── */
            '<div id="detailsPanel" class="como-panel" role="tabpanel">' +
                '<div class="como-content">' +
                    categoriesHTML +
                '</div>' +
                '<div class="como-actions">' +
                    (getModelName() === 'opt-in'
                        ? '<button class="como-btn como-accept-btn">' + getText('buttons.allowAll') + '</button>' +
                          '<button id="comoAllowSelBtn" class="como-btn" disabled>' + getText('buttons.allowSelection') + '</button>' +
                          '<button class="como-btn como-deny-btn">' + getText('buttons.denyAll') + '</button>'
                        : '<button class="como-btn como-accept-btn">' + getText('buttons.allowAll') + '</button>' +
                          '<button id="comoDenySelBtn" class="como-btn como-btn-secondary">' + getText('buttons.denyAll') + '</button>'
                    ) +
                '</div>' +
                getDnsmpiLinkHtml() +
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
                getDnsmpiLinkHtml() +
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
                defaultState.wait_for_update = window.comoWaitForUpdate || (globalConfig.consentMode && globalConfig.consentMode.waitForUpdate) || 500;
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

            /* Detect known services for cookie declaration tables */
            detectKnownServices();

            var container = document.createElement('div');
            container.id = cfg.containerId;
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
                    var nameSpan = this.querySelector('.como-category-name');
                    var nameRect = nameSpan.getBoundingClientRect();
                    if (e.clientX <= nameRect.right) {
                        toggleCategory(this);
                    } else {
                        var toggle = this.querySelector('.como-toggle');
                        if (toggle && !toggle.classList.contains('disabled')) {
                            toggleSwitch(toggle);
                        }
                    }
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

            /* ── Details panel dynamic buttons ── */
            var allowSelBtn = document.getElementById('comoAllowSelBtn');
            if (allowSelBtn) {
                allowSelBtn.addEventListener('click', function () { handleConsent('selected'); });
            }
            var denySelBtn = document.getElementById('comoDenySelBtn');
            if (denySelBtn) {
                denySelBtn._consentType = 'deny-all';
                denySelBtn.addEventListener('click', function () {
                    handleConsent(this._consentType || 'deny-all');
                });
            }

            /* ── DNSMPI buttons ── */
            var dnsmptBtns = container.querySelectorAll('.como-dnsmpi-btn');
            for (var ns = 0; ns < dnsmptBtns.length; ns++) {
                dnsmptBtns[ns].addEventListener('click', function () { handleConsent('dnsmpi'); });
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

            /* ── Keyboard accessibility (WCAG 2.1.1, 2.1.2, 2.4.3) ── */
            document.addEventListener('keydown', function (e) {
                var banner = document.getElementById(cfg.bannerId);
                if (!banner || banner.style.display === 'none') return;

                /* Arrow keys: navigate between tabs (ARIA tablist pattern) */
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    var focused = document.activeElement;
                    if (focused && focused.getAttribute('role') === 'tab') {
                        var tabBtnsAK = container.querySelectorAll('.como-tab');
                        var currentIdx = -1;
                        for (var ti = 0; ti < tabBtnsAK.length; ti++) {
                            if (tabBtnsAK[ti] === focused) { currentIdx = ti; break; }
                        }
                        if (currentIdx !== -1) {
                            var nextIdx = e.key === 'ArrowRight'
                                ? (currentIdx + 1) % tabBtnsAK.length
                                : (currentIdx - 1 + tabBtnsAK.length) % tabBtnsAK.length;
                            e.preventDefault();
                            tabBtnsAK[nextIdx].focus({ focusVisible: true });
                            tabBtnsAK[nextIdx].click();
                        }
                    }
                    return;
                }

                /* Escape: close banner (only when model permits closing without a choice) */
                if (e.key === 'Escape') {
                    if (getMode().showCloseButton) {
                        e.preventDefault();
                        handleConsent('accept-all');
                    }
                    return;
                }

                /* Tab / Shift+Tab: focus trap — cycle only within banner */
                if (e.key !== 'Tab') return;
                var focusable = banner.querySelectorAll('button:not([disabled]), [tabindex="0"]');
                if (!focusable.length) return;
                var first = focusable[0];
                var last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus({ focusVisible: true });
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus({ focusVisible: true });
                    }
                }
            });

            /* Initialize toggle button text based on default states */
            updateDetailsBtns();

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
