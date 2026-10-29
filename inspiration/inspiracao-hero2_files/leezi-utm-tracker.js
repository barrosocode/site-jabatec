/**
 * Leezi CRM - UTM Tracker
 * Captura e persiste parâmetros UTM para uso em formulários
 */
(function() {
    'use strict';

    // Parâmetros UTM a serem rastreados
    const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
    const STORAGE_KEY = 'leezi_utm_params';
    const STORAGE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos
    const DEBUG = true; // Ativar logs de debug

    /**
     * Log de debug
     */
    function log(message, data) {
        if (DEBUG) {
            if (data !== undefined) {
                console.log('[Leezi UTM]', message, data);
            } else {
                console.log('[Leezi UTM]', message);
            }
        }
    }

    /**
     * Obter parâmetros da URL
     */
    function getUrlParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);

        log('URL atual:', window.location.href);

        UTM_PARAMS.forEach(function(param) {
            const value = urlParams.get(param);
            if (value) {
                params[param] = value;
                log('UTM capturado:', param + ' = ' + value);
            }
        });

        log('Total de UTMs capturados:', Object.keys(params).length);
        return params;
    }

    /**
     * Salvar UTMs no sessionStorage
     */
    function saveUtmParams(params) {
        if (Object.keys(params).length > 0) {
            const data = {
                params: params,
                timestamp: new Date().getTime()
            };

            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                log('UTMs salvos com sucesso:', params);
            } catch (e) {
                console.error('[Leezi UTM] Erro ao salvar UTM params:', e);
            }
        } else {
            log('Nenhum UTM para salvar');
        }
    }

    /**
     * Obter UTMs salvos
     */
    function getSavedUtmParams() {
        try {
            // Tentar do sessionStorage primeiro
            let data = sessionStorage.getItem(STORAGE_KEY);
            let source = 'sessionStorage';

            // Se não houver no sessionStorage, tentar localStorage
            if (!data) {
                data = localStorage.getItem(STORAGE_KEY);
                source = 'localStorage';
            }

            if (data) {
                const parsed = JSON.parse(data);

                // Verificar se os dados não expiraram (30 dias)
                const now = new Date().getTime();
                const age = now - parsed.timestamp;
                const ageDays = Math.floor(age / (24 * 60 * 60 * 1000));

                if (age < STORAGE_DURATION) {
                    log('UTMs recuperados de ' + source + ' (idade: ' + ageDays + ' dias):', parsed.params);
                    return parsed.params;
                } else {
                    log('UTMs expirados (idade: ' + ageDays + ' dias). Limpando...');
                    sessionStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem(STORAGE_KEY);
                }
            } else {
                log('Nenhum UTM salvo encontrado');
            }
        } catch (e) {
            console.error('[Leezi UTM] Erro ao recuperar UTM params:', e);
        }

        return {};
    }

    /**
     * Adicionar campos hidden aos formulários Elementor
     */
    function addUtmFieldsToForms() {
        const utmParams = getSavedUtmParams();

        if (Object.keys(utmParams).length === 0) {
            log('Nenhum UTM para adicionar aos formulários');
            return;
        }

        log('Preparando para adicionar UTMs aos formulários:', utmParams);

        // Verificar se jQuery está disponível
        if (typeof jQuery === 'undefined') {
            console.error('[Leezi UTM] jQuery não está carregado!');
            return;
        }

        // Função para registrar o hook do Elementor
        function registerElementorHook() {
            if (typeof elementorFrontend === 'undefined' ||
                typeof elementorFrontend.hooks === 'undefined') {
                log('Elementor hooks ainda não disponível');
                return false;
            }

            log('Registrando hook do Elementor...');

            elementorFrontend.hooks.addAction('frontend/element_ready/form.default', function($scope) {
                const $form = $scope.find('form.elementor-form');

                if ($form.length) {
                    log('Formulário Elementor encontrado. Adicionando campos UTM...');

                    let fieldsAdded = 0;
                    Object.keys(utmParams).forEach(function(param) {
                        const existingField = $form.find('input[name="' + param + '"]');

                        if (existingField.length === 0) {
                            const hiddenField = jQuery('<input>', {
                                type: 'hidden',
                                name: param,
                                value: utmParams[param],
                                'data-leezi-utm': 'true'
                            });

                            $form.append(hiddenField);
                            fieldsAdded++;
                            log('Campo adicionado:', param + ' = ' + utmParams[param]);
                        } else {
                            existingField.val(utmParams[param]);
                            log('Campo atualizado:', param + ' = ' + utmParams[param]);
                        }
                    });

                    log('Total de campos UTM adicionados/atualizados:', fieldsAdded);
                }
            });

            return true;
        }

        // Tentar registrar imediatamente
        if (!registerElementorHook()) {
            log('Aguardando Elementor carregar completamente...');

            // Aguardar o evento de inicialização do Elementor
            jQuery(window).on('elementor/frontend/init', function() {
                log('Elementor inicializado via evento.');
                registerElementorHook();
            });
        }

        // Fallback para formulários já renderizados
        jQuery(document).ready(function() {
            setTimeout(function() {
                log('Executando fallback para formulários já renderizados...');
                const $forms = jQuery('form.elementor-form');
                log('Formulários encontrados:', $forms.length);

                $forms.each(function(index) {
                    const $form = jQuery(this);

                    // Verificar se já tem campos UTM adicionados
                    if ($form.find('input[data-leezi-utm="true"]').length > 0) {
                        log('Formulário ' + index + ' já tem campos UTM. Pulando...');
                        return;
                    }

                    log('Adicionando UTMs ao formulário ' + index);
                    let fieldsAdded = 0;

                    Object.keys(utmParams).forEach(function(param) {
                        const existingField = $form.find('input[name="' + param + '"]');

                        if (existingField.length === 0) {
                            const hiddenField = jQuery('<input>', {
                                type: 'hidden',
                                name: param,
                                value: utmParams[param],
                                'data-leezi-utm': 'true'
                            });

                            $form.append(hiddenField);
                            fieldsAdded++;
                        }
                    });

                    log('Campos adicionados ao formulário ' + index + ':', fieldsAdded);
                });
            }, 1000);
        });
    }

    /**
     * Inicializar
     */
    function init() {
        log('=== Leezi UTM Tracker Inicializado ===');
        log('Versão do script: 1.2.4');

        // Capturar UTMs da URL atual
        const urlParams = getUrlParams();

        // Se houver UTMs na URL, salvar
        if (Object.keys(urlParams).length > 0) {
            log('Salvando novos UTMs da URL...');
            saveUtmParams(urlParams);
        } else {
            log('Nenhum UTM na URL atual');
        }

        // Adicionar campos aos formulários
        addUtmFieldsToForms();

        log('=== Inicialização Concluída ===');
    }

    // Inicializar quando o DOM estiver pronto
    log('Registrando inicializador...');
    if (document.readyState === 'loading') {
        log('DOM ainda carregando. Aguardando DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        log('DOM já carregado. Inicializando imediatamente...');
        init();
    }

})();
