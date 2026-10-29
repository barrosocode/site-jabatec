/**
 * Vime WhatsApp Button - Frontend Script
 */
(function() {
    'use strict';
    
    let selectedPhone = null;
    const STORAGE_KEY = 'vimewpp_selected_phone';
    
    /**
     * Get selected phone from sessionStorage
     */
    function getStoredPhone() {
        try {
            return sessionStorage.getItem(STORAGE_KEY);
        } catch(e) {
            return null;
        }
    }
    
    /**
     * Store selected phone in sessionStorage
     */
    function storePhone(phone) {
        try {
            sessionStorage.setItem(STORAGE_KEY, phone);
        } catch(e) {
            console.warn('Could not store phone in sessionStorage');
        }
    }
    
    /**
     * Select phone based on weighted distribution
     */
    function selectPhoneByWeight() {
        if (!window.vimewpp_vars || !window.vimewpp_vars.numbers || window.vimewpp_vars.numbers.length === 0) {
            return null;
        }
        
        const numbers = window.vimewpp_vars.numbers;
        
        if (numbers.length === 1) {
            return numbers[0].phone;
        }
        
        const totalWeight = numbers.reduce((sum, num) => sum + parseInt(num.weight || 0), 0);
        
        if (totalWeight === 0) {
            return numbers[0].phone;
        }
        
        const random = Math.random() * totalWeight;
        let accumulated = 0;
        
        for (let i = 0; i < numbers.length; i++) {
            accumulated += parseInt(numbers[i].weight || 0);
            if (random < accumulated) {
                return numbers[i].phone;
            }
        }
        
        return numbers[numbers.length - 1].phone;
    }
    
    /**
     * Get selected phone (from storage or select new)
     */
    function getSelectedPhone() {
        if (selectedPhone) {
            return selectedPhone;
        }
        
        selectedPhone = getStoredPhone();
        
        if (!selectedPhone) {
            selectedPhone = selectPhoneByWeight();
            if (selectedPhone) {
                storePhone(selectedPhone);
            }
        }
        
        return selectedPhone;
    }
    
    /**
     * Replace tokens in text
     */
    function replaceTokens(text) {
        if (!text) return '';
        
        // Get clean page title - prioritize server-side value
        let pageTitle = window.vimewpp_vars.page_title || '';
        
        // If no server-side page title, try to clean document.title
        if (!pageTitle && document.title) {
            pageTitle = document.title;
            const siteName = window.vimewpp_vars.site_name || '';
            
            if (siteName) {
                // Try different separator patterns
                const separators = [
                    ' – ' + siteName,
                    ' - ' + siteName, 
                    ' | ' + siteName,
                    ' » ' + siteName,
                    ' · ' + siteName,
                    ' — ' + siteName,
                    siteName + ' – ',
                    siteName + ' - ',
                    siteName + ' | ',
                    siteName + ' » ',
                    siteName + ' · ',
                    siteName + ' — '
                ];
                
                for (const sep of separators) {
                    if (pageTitle.includes(sep)) {
                        pageTitle = pageTitle.replace(sep, '').trim();
                        break;
                    }
                }
                
                // If page title is still the same as site name, use generic
                if (pageTitle === siteName) {
                    pageTitle = 'Início';
                }
            }
        }
        
        const tokens = {
            '{site_name}': window.vimewpp_vars.site_name || '',
            '{page_title}': pageTitle,
            '{current_url}': window.location.href,
            '{post_id}': window.vimewpp_vars.post_id || '',
            '{date}': new Date().toISOString().split('T')[0],
            '{time}': new Date().toTimeString().split(' ')[0].substring(0, 5),
            '{user_ip}': window.vimewpp_vars.user_ip || '',
            '{user_agent}': navigator.userAgent || ''
        };
        
        let result = text;
        for (const [token, value] of Object.entries(tokens)) {
            result = result.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        }
        
        return result;
    }
    
    /**
     * Get message for button
     */
    function getMessage(button) {
        const messageSource = button.getAttribute('data-message-source') || 'default';
        let message = '';
        
        if (messageSource === 'custom') {
            message = button.getAttribute('data-custom-message') || '';
        } else if (messageSource === 'page') {
            const postId = button.getAttribute('data-post-id');
            const metaTag = document.querySelector('meta[name="vimewpp_custom_message"]');
            if (metaTag) {
                message = metaTag.getAttribute('content') || '';
            }
        }
        
        if (!message) {
            message = window.vimewpp_vars.default_message || '';
        }
        
        return replaceTokens(message);
    }
    
    /**
     * Get extra parameters
     */
    function getExtraParams(button) {
        const params = {};
        
        if (window.vimewpp_vars.extra_params && Array.isArray(window.vimewpp_vars.extra_params)) {
            window.vimewpp_vars.extra_params.forEach(param => {
                if (param.key) {
                    params[param.key] = replaceTokens(param.value || '');
                }
            });
        }
        
        const widgetParams = button.getAttribute('data-extra-params');
        if (widgetParams) {
            try {
                const parsed = JSON.parse(widgetParams);
                for (const [key, value] of Object.entries(parsed)) {
                    params[key] = replaceTokens(value || '');
                }
            } catch(e) {
                console.warn('Could not parse widget extra params');
            }
        }
        
        return params;
    }
    
    /**
     * Build WhatsApp URL
     */
    function buildWhatsAppUrl(phone, message, extraParams) {
        const urlPrefix = window.vimewpp_vars.url_prefix || 'https://wa.me/';
        let url = '';
        
        if (urlPrefix.includes('wa.me')) {
            url = `${urlPrefix}${phone}`;
            if (message) {
                url += `?text=${encodeURIComponent(message)}`;
            }
        } else {
            url = `${urlPrefix}?phone=${phone}`;
            if (message) {
                url += `&text=${encodeURIComponent(message)}`;
            }
        }
        
        for (const [key, value] of Object.entries(extraParams)) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
        
        return url;
    }
    
    /**
     * Handle button click
     */
    function handleButtonClick(event) {
        const button = event.target.closest('.vimewpp-button');
        if (!button) return;
        
        event.preventDefault();
        
        const phone = getSelectedPhone();
        if (!phone) {
            console.error('No WhatsApp number configured');
            return;
        }
        
        const message = getMessage(button);
        const extraParams = getExtraParams(button);
        const url = buildWhatsAppUrl(phone, message, extraParams);
        
        button.href = url;
        
        if (button.target === '_blank') {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = url;
        }
    }
    
    /**
     * Initialize
     */
    function init() {
        document.addEventListener('click', function(event) {
            if (event.target.closest('.vimewpp-button')) {
                handleButtonClick(event);
            }
        });
        
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                const button = event.target.closest('.vimewpp-button');
                if (button) {
                    event.preventDefault();
                    handleButtonClick(event);
                }
            }
        });
        
        const metaCustomMessage = document.querySelector('meta[property="vimewpp:custom_message"]');
        if (!metaCustomMessage && window.vimewpp_page_meta && window.vimewpp_page_meta.custom_message) {
            const meta = document.createElement('meta');
            meta.setAttribute('name', 'vimewpp_custom_message');
            meta.setAttribute('content', window.vimewpp_page_meta.custom_message);
            document.head.appendChild(meta);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.vimewpp = {
        getSelectedPhone: getSelectedPhone,
        selectPhoneByWeight: selectPhoneByWeight,
        replaceTokens: replaceTokens,
        buildWhatsAppUrl: buildWhatsAppUrl
    };
    
})();