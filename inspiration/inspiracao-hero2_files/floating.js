/**
 * Vime WhatsApp Floating Button
 */
(function() {
    'use strict';
    
    let selectedPhone = null;
    const STORAGE_KEY = 'vimewpp_selected_phone';
    
    /**
     * Get selected phone
     */
    function getSelectedPhone() {
        if (selectedPhone) {
            return selectedPhone;
        }
        
        // Check sessionStorage
        try {
            selectedPhone = sessionStorage.getItem(STORAGE_KEY);
            if (selectedPhone) {
                return selectedPhone;
            }
        } catch(e) {}
        
        // Use custom phone if set
        if (!window.vimewpp_floating.use_global && window.vimewpp_floating.phone) {
            selectedPhone = window.vimewpp_floating.phone;
            return selectedPhone;
        }
        
        // Use global distribution
        if (window.vimewpp_floating.use_global && window.vimewpp_floating.global_numbers) {
            selectedPhone = selectPhoneByWeight(window.vimewpp_floating.global_numbers);
            if (selectedPhone) {
                try {
                    sessionStorage.setItem(STORAGE_KEY, selectedPhone);
                } catch(e) {}
            }
            return selectedPhone;
        }
        
        return null;
    }
    
    /**
     * Select phone by weight
     */
    function selectPhoneByWeight(numbers) {
        if (!numbers || numbers.length === 0) {
            return null;
        }
        
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
     * Replace tokens
     */
    function replaceTokens(text) {
        if (!text) return '';
        
        const tokens = window.vimewpp_floating.tokens || {};
        let result = text;
        
        for (const [key, value] of Object.entries(tokens)) {
            result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        }
        
        return result;
    }
    
    /**
     * Build WhatsApp URL
     */
    function buildWhatsAppUrl(message) {
        const phone = getSelectedPhone();
        if (!phone) {
            console.error('No WhatsApp phone configured');
            return null;
        }
        
        const settings = window.vimewpp_floating.settings;
        let url = 'https://wa.me/' + phone;
        
        if (message) {
            url += '?text=' + encodeURIComponent(message);
        }
        
        return url;
    }
    
    /**
     * Initialize floating button
     */
    function init() {
        const settings = window.vimewpp_floating.settings;
        const button = document.getElementById('vimewpp-floating-button');
        
        if (!button) return;
        
        // Apply custom styles
        const trigger = button.querySelector('.vimewpp-floating-trigger');
        if (trigger) {
            trigger.style.width = settings.button_size + 'px';
            trigger.style.height = settings.button_size + 'px';
            trigger.style.backgroundColor = settings.button_color;
            trigger.style.color = settings.icon_color;
            
            // Apply icon size
            const iconSize = settings.icon_size || 60;
            const svg = trigger.querySelector('svg');
            if (svg) {
                svg.style.width = iconSize + '%';
                svg.style.height = iconSize + '%';
            }
        }
        
        // Apply margins
        const position = settings.position || 'bottom-right';
        if (position.includes('bottom')) {
            button.style.bottom = settings.margin_y + 'px';
        } else {
            button.style.top = settings.margin_y + 'px';
        }
        
        if (position.includes('right')) {
            button.style.right = settings.margin_x + 'px';
        } else {
            button.style.left = settings.margin_x + 'px';
        }
        
        // Show button with delay
        const delay = parseInt(settings.delay) || 0;
        setTimeout(() => {
            button.style.display = 'block';
            
            // Handle tooltip
            const tooltip = button.querySelector('.vimewpp-tooltip');
            if (tooltip) {
                const tooltipShow = tooltip.dataset.show;
                const tooltipDelay = parseInt(tooltip.dataset.delay) || 5;
                
                // Auto show tooltip
                if (tooltipShow === 'auto' || tooltipShow === 'both') {
                    setTimeout(() => {
                        tooltip.classList.add('vimewpp-tooltip-visible');
                        
                        // Hide after 5 seconds
                        setTimeout(() => {
                            tooltip.classList.remove('vimewpp-tooltip-visible');
                        }, 5000);
                    }, tooltipDelay * 1000);
                }
            }
            
            // Auto open chatbox
            if (settings.auto_open && settings.chatbox_enabled) {
                const autoOpenDelay = parseInt(settings.auto_open_delay) || 0;
                setTimeout(() => {
                    openChatbox();
                }, autoOpenDelay * 1000);
            }
        }, delay * 1000);
        
        // Click handler for trigger button
        trigger.addEventListener('click', handleTriggerClick);
        
        // Chatbox handlers
        const chatbox = button.querySelector('.vimewpp-chatbox');
        if (chatbox) {
            const closeBtn = chatbox.querySelector('.vimewpp-chatbox-close');
            const sendBtn = chatbox.querySelector('.vimewpp-chat-send');
            const input = chatbox.querySelector('.vimewpp-chat-input');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', closeChatbox);
            }
            
            if (sendBtn) {
                sendBtn.addEventListener('click', sendMessage);
            }
            
            if (input) {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });
            }
        }
        
        // Remove notification on first interaction
        button.addEventListener('click', function() {
            const badge = button.querySelector('.vimewpp-notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
        }, { once: true });
    }
    
    /**
     * Handle trigger button click
     */
    function handleTriggerClick(e) {
        e.preventDefault();
        const settings = window.vimewpp_floating.settings;
        const button = document.getElementById('vimewpp-floating-button');
        const chatbox = button.querySelector('.vimewpp-chatbox');
        
        if (settings.chatbox_enabled && chatbox) {
            // Toggle chatbox
            if (chatbox.style.display === 'none' || !chatbox.style.display) {
                openChatbox();
            } else {
                closeChatbox();
            }
        } else {
            // Direct to WhatsApp
            const message = replaceTokens(settings.message);
            const url = buildWhatsAppUrl(message);
            if (url) {
                window.open(url, '_blank');
            }
        }
    }
    
    /**
     * Open chatbox
     */
    function openChatbox() {
        const button = document.getElementById('vimewpp-floating-button');
        const chatbox = button.querySelector('.vimewpp-chatbox');
        
        if (!chatbox) return;
        
        chatbox.style.display = 'block';
        chatbox.classList.add('vimewpp-chatbox-open');
        
        // Play sound if enabled
        const settings = window.vimewpp_floating.settings;
        if (settings.sound) {
            playNotificationSound();
        }
        
        // Focus input
        const input = chatbox.querySelector('.vimewpp-chat-input');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }
    
    /**
     * Close chatbox
     */
    function closeChatbox() {
        const button = document.getElementById('vimewpp-floating-button');
        const chatbox = button.querySelector('.vimewpp-chatbox');
        
        if (!chatbox) return;
        
        chatbox.classList.remove('vimewpp-chatbox-open');
        setTimeout(() => {
            chatbox.style.display = 'none';
        }, 300);
    }
    
    /**
     * Send message
     */
    function sendMessage() {
        const button = document.getElementById('vimewpp-floating-button');
        const input = button.querySelector('.vimewpp-chat-input');
        
        if (!input) return;
        
        let message = input.value.trim();
        if (!message) {
            message = replaceTokens(window.vimewpp_floating.settings.message);
        } else {
            // Append user message to default message
            const defaultMessage = replaceTokens(window.vimewpp_floating.settings.message);
            if (defaultMessage) {
                message = defaultMessage + '\n\n' + message;
            }
        }
        
        const url = buildWhatsAppUrl(message);
        if (url) {
            window.open(url, '_blank');
            
            // Close chatbox after sending
            setTimeout(() => {
                closeChatbox();
                input.value = '';
            }, 500);
        }
    }
    
    /**
     * Play notification sound
     */
    function playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRkAEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRwEAAAAAAEA/v8CAP//AAABAP//AQABAP7/AQD//wEAAQD+/wIA//8AAAEA/v8CAP//AAABAP7/AgD//wAAAQD+/wIA//8AAAEA/v8CAP//AAABAP7/AgD//wAAAQD+/wIA//8AAAEA/v8BAP//AQABAP7/AQABAP7/AQABAP7/AQABAP7/AQABAP7/AQABAP7/AQD//wEAAQD+/wEA//8BAAEA/v8BAP//AQABAP7/AQD//wEAAQD+/wEA//8BAAEA/v8BAP//AQABAP7/AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQABAP7/AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQABAP7/AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQABAP7/AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQABAP7/AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQABAP7/AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQABAP7/AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQABAP7/AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA//8BAAEA/f8CAP//AQABAP3/AgD//wEAAQD9/wIA');
            audio.volume = 0.3;
            audio.play();
        } catch(e) {}
    }
    
    /**
     * DOM Ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();