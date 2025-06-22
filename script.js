// CriamundoApp - Nova implementação com fluxo automático
class CriamundoApp {
    constructor() {
        this.voiceManager = new VoiceManager();
        this.aiManager = new AIManager();
        this.screenManager = new ScreenManager();
        this.audioPermissionGranted = false;
        this.userHasInteracted = false;
        this.isProcessing = false;
        this.buttonActive = false;
        this.capturedText = '';
        this.currentTimeout = null;
        
        // Sistema de logs detalhado
        this.logEvents = [];
        this.startTime = Date.now();
        
        this.initAudio();
        this.init();
        
        // Adicionar botão de debug temporário
        this.addDebugButton();
        
        // Iniciar monitoramento do botão
        this.startButtonMonitoring();
    }

    log(message, type = 'INFO') {
        const timestamp = Date.now() - this.startTime;
        const logEntry = `[${timestamp}ms] [${type}] ${message}`;
        console.log(logEntry);
        this.logEvents.push(logEntry);
        
        // Mostrar no console do navegador para debug
        if (type === 'ERROR') {
            console.error(logEntry);
        } else if (type === 'WARN') {
            console.warn(logEntry);
        }
    }

    getLogs() {
        return this.logEvents.join('\n');
    }

    exportLogs() {
        const logs = this.getLogs();
        console.log('=== LOGS COMPLETOS DO CRIAMUNDO ===');
        console.log(logs);
        
        // Criar arquivo de download
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `criamundo-logs-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.log('Logs exportados para arquivo');
    }

    // Método para debug - adicionar botão temporário
    addDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '🔍 Debug Logs';
        debugBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        debugBtn.onclick = () => {
            this.exportLogs();
        };
        document.body.appendChild(debugBtn);
        this.log('Botão de debug adicionado');
        
        // Adicionar botão de verificação de estado
        const stateBtn = document.createElement('button');
        stateBtn.textContent = '📊 Estado';
        stateBtn.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            z-index: 9999;
            background: #4ecdc4;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        stateBtn.onclick = () => {
            this.checkActiveTimeouts();
            const btn = document.getElementById('create-story-btn');
            if (btn) {
                this.log(`Estado do botão: display=${btn.style.display}, visible=${btn.classList.contains('visible')}`);
            }
        };
        document.body.appendChild(stateBtn);
        this.log('Botão de estado adicionado');
        
        // Adicionar botão para forçar visibilidade
        const forceBtn = document.createElement('button');
        forceBtn.textContent = '🔧 Forçar';
        forceBtn.style.cssText = `
            position: fixed;
            top: 90px;
            right: 10px;
            z-index: 9999;
            background: #ffa726;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        forceBtn.onclick = () => {
            this.forceButtonVisible();
        };
        document.body.appendChild(forceBtn);
        this.log('Botão de forçar visibilidade adicionado');
    }

    setupUserInteraction() {
        this.log('Configurando detecção de interação do usuário...');
        
        const handleInteraction = () => {
            if (!this.userHasInteracted) {
                this.log('Primeira interação do usuário detectada!');
                this.userHasInteracted = true;
                
                // Remover listeners após primeira interação
                document.removeEventListener('click', handleInteraction);
                document.removeEventListener('touchstart', handleInteraction);
                document.removeEventListener('keydown', handleInteraction);
                
                // Iniciar fluxo após interação
                setTimeout(() => {
                    this.log('Iniciando fluxo após interação do usuário...');
                    this.startInteractionLoop();
                }, 500);
            }
        };
        
        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        document.addEventListener('keydown', handleInteraction);
    }

    initAudio() {
        this.log('Iniciando configuração de áudio...');
        
        // Inicializar contexto de áudio para sons
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.log('Contexto de áudio inicializado');
        } catch (error) {
            this.log('Áudio não suportado para sons de interface', 'WARN');
        }
    }

    playClickSound() {
        this.log('Tocando som de clique...');
        if (!this.audioContext) return;
        
        // Garantir que o contexto de áudio esteja ativo
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (error) {
            // Silenciosamente ignorar erros de áudio
        }
    }

    async init() {
        this.log('Inicializando aplicativo...');
        
        // Inicializar gerenciador de telas
        await this.screenManager.init();
        
        // Remover loading inicial
        const initialLoading = document.getElementById('initial-loading');
        if (initialLoading) {
            initialLoading.remove();
        }
        
        // Verificar se já tem permissão salva
        const savedPermission = localStorage.getItem('audioPermission');
        if (savedPermission === 'granted') {
            this.log('Permissão de áudio encontrada no localStorage');
            this.audioPermissionGranted = true;
        } else {
            this.log('Nenhuma permissão de áudio salva, mostrando modal...');
            // Mostrar modal apenas uma vez no início
            setTimeout(() => {
                this.showAudioPermissionModal();
            }, 100);
        }
        
        // Configurar interação do usuário
        this.setupUserInteraction();
        
        // Adicionar botões de debug
        this.addDebugButton();
        
        // Iniciar monitoramento do botão
        this.startButtonMonitoring();
    }

    hasStoredPermission() {
        return localStorage.getItem('criamundo_audio_permission') === 'granted';
    }

    savePermission() {
        localStorage.setItem('criamundo_audio_permission', 'granted');
        this.audioPermissionGranted = true;
    }

    showAudioPermissionModal() {
        this.log('Mostrando modal de permissão de áudio...');
        
        const modal = document.getElementById('audio-permission-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.log('Modal de permissão exibida');
            
            // Configurar botões da modal
            const okBtn = document.getElementById('audio-permission-ok');
            const cancelBtn = document.getElementById('audio-permission-cancel');
            
            if (okBtn) {
                okBtn.onclick = () => {
                    this.log('Botão OK da modal clicado');
                    this.playClickSound();
                    this.grantAudioPermission();
                };
            }
            
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    this.log('Botão Cancelar da modal clicado');
                    this.playClickSound();
                    this.hideAudioPermissionModal();
                    // Se cancelar, mostrar modal novamente após um tempo
                    setTimeout(() => {
                        this.showAudioPermissionModal();
                    }, 1000);
                };
            }
        } else {
            this.log('ERRO: Modal de permissão não encontrada', 'ERROR');
        }
    }

    hideAudioPermissionModal() {
        this.log('Escondendo modal de permissão...');
        const modal = document.getElementById('audio-permission-modal');
        if (modal) {
            modal.style.display = 'none';
            this.log('Modal de permissão escondida');
        }
    }

    grantAudioPermission() {
        this.log('Permissão de áudio concedida pelo usuário');
        this.audioPermissionGranted = true;
        localStorage.setItem('audioPermission', 'granted');
        
        this.hideAudioPermissionModal();
        
        // Iniciar fluxo após permissão
        setTimeout(() => {
            this.log('Iniciando fluxo após concessão de permissão...');
            this.startInteractionLoop();
        }, 500);
    }

    startInteractionLoop() {
        this.log('=== INÍCIO DO LOOP DE INTERAÇÃO ===');
        this.log(`Estado atual - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}, userHasInteracted: ${this.userHasInteracted}`);
        this.log(`Stack trace da chamada:`, new Error().stack);
        
        if (this.isProcessing) {
            this.log('Já está processando, ignorando nova chamada', 'WARN');
            return;
        }
        
        if (this.buttonActive) {
            this.log('Botão ativo, aguardando ação do usuário - NÃO reiniciando fluxo', 'WARN');
            this.log(`Stack trace da chamada:`, new Error().stack);
            return;
        }
        
        this.log('Iniciando loop de interação por voz...');
        this.isProcessing = true;
        
        const question = "Qual história você quer que eu conte?";
        
        if (document.getElementById('welcome-screen').classList.contains('active')) {
            if (!this.audioPermissionGranted) {
                this.log('Permissão de áudio perdida, solicitando novamente...', 'ERROR');
                this.isProcessing = false;
                this.showAudioPermissionModal();
                return;
            }

            if (!this.userHasInteracted) {
                this.log('Aguardando interação do usuário...', 'WARN');
                this.isProcessing = false;
                return;
            }

            this.log('Fazendo pergunta para a criança...');
            this.voiceManager.speak(question, () => {
                this.log('Pergunta falada, iniciando gravação automática...');
                this.startAutoRecording();
            });
        }
    }

    startAutoRecording() {
        this.log('=== INICIANDO GRAVAÇÃO AUTOMÁTICA ===');
        this.log(`Estado atual - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}`);
        
        // Verificar se o botão está ativo antes de iniciar gravação
        if (this.buttonActive) {
            this.log('ERRO: Tentando iniciar gravação com botão ativo!', 'ERROR');
            this.log(`Stack trace da chamada:`, new Error().stack);
            return;
        }
        
        // Configurar callbacks do voice manager
        this.voiceManager.onRecordingStart = () => {
            this.log('Gravação iniciada, mostrando animação...');
            this.showRecordingAnimation();
        };
        
        this.voiceManager.onResult = (finalTranscript, interimTranscript) => {
            this.log(`Resultado da gravação - Final: "${finalTranscript}" | Intermediário: "${interimTranscript}"`);
            
            // Se temos resultado final, processar
            if (finalTranscript.trim()) {
                this.capturedText = finalTranscript.trim();
                this.log(`Texto final capturado: "${this.capturedText}"`);
            }
        };
        
        this.voiceManager.onRecordingEnd = () => {
            this.log('=== GRAVAÇÃO FINALIZADA ===');
            this.log(`Estado após gravação - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}`);
            this.hideRecordingAnimation();
            
            // Processar o texto capturado
            if (this.capturedText && this.capturedText.trim()) {
                this.log(`Processando texto capturado: "${this.capturedText}"`);
                this.confirmAndProceed();
            } else {
                this.log('Nenhum texto capturado, reiniciando...', 'WARN');
                setTimeout(() => {
                    this.resetFlow();
                    this.startInteractionLoop();
                }, 2000);
            }
        };
        
        this.voiceManager.onError = (error) => {
            this.log(`Erro na gravação: ${error}`, 'ERROR');
            this.hideRecordingAnimation();
            
            if (error === 'not-allowed') {
                this.log('Permissão negada, mostrando modal...', 'ERROR');
                this.showAudioPermissionModal();
            } else {
                setTimeout(() => {
                    this.resetFlow();
                    this.startInteractionLoop();
                }, 2000);
            }
        };
        
        // Iniciar gravação
        this.log('Iniciando gravação no voice manager...');
        this.voiceManager.startRecording();
    }

    confirmAndProceed() {
        this.log('=== CONFIRMAÇÃO E PROSSEGUIMENTO ===');
        this.log(`Tema capturado: "${this.capturedText}"`);
        this.log(`Estado atual - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}`);
        
        const confirmationText = `Vou criar a história ${this.capturedText}. Clique no botão amarelo Criar História!`;
        this.log(`Texto de confirmação: "${confirmationText}"`);

        // Verificar se ainda tem permissão antes de falar
        if (!this.audioPermissionGranted) {
            this.log('Permissão de áudio perdida, solicitando novamente...', 'ERROR');
            this.showAudioPermissionModal();
            return;
        }

        this.log('Falando confirmação...');
        this.voiceManager.speak(confirmationText, () => {
            this.log('Confirmação falada, mostrando botão amarelo...');
            this.log(`Estado antes de mostrar botão - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}`);
            
            // IMPORTANTE: Resetar isProcessing quando mostrar o botão
            this.isProcessing = false;
            this.log(`isProcessing resetado para false`);
            
            // Garantir que o botão seja mostrado corretamente
            const createBtn = document.getElementById('create-story-btn');
            if (createBtn) {
                this.log('Botão encontrado, configurando...');
                this.log(`Estado do botão antes: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
                
                // CORREÇÃO: Remover animações conflitantes
                createBtn.style.animation = 'none';
                createBtn.style.transition = 'none';
                
                createBtn.style.display = 'block';
                createBtn.style.visibility = 'visible';
                createBtn.style.opacity = '1';
                createBtn.style.transform = 'translateY(0)';
                
                // Forçar reflow antes de adicionar a classe
                createBtn.offsetHeight;
                
                createBtn.classList.add('visible');
                createBtn.onclick = () => {
                    this.log('=== BOTÃO AMARELO CLICADO ===');
                    this.playClickSound();
                    this.generateStory();
                };
                
                // Marcar que o botão está ativo para evitar que seja resetado
                this.buttonActive = true;
                this.log(`Botão amarelo ativo, aguardando clique do usuário...`);
                this.log(`Estado após configurar botão - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}`);
                this.log(`Estado do botão após: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
                
                // Verificar se o botão está realmente visível
                setTimeout(() => {
                    const btn = document.getElementById('create-story-btn');
                    if (btn) {
                        this.log(`Verificação do botão após 1s: display=${btn.style.display}, visible=${btn.classList.contains('visible')}, buttonActive=${this.buttonActive}, isProcessing=${this.isProcessing}`);
                        
                        // Se o botão não está visível, tentar corrigir
                        if (btn.style.display === 'none' || !btn.classList.contains('visible')) {
                            this.log('⚠️ Botão não está visível após 1s, tentando corrigir...', 'WARN');
                            this.fixCSSIssues();
                        }
                    }
                }, 1000);
                
            } else {
                this.log('ERRO: Botão amarelo não encontrado!', 'ERROR');
            }
        });
    }

    requestAudioPermission() {
        // Mostrar modal de permissão novamente
        this.showAudioPermissionModal();
    }

    generateStory() {
        this.log('=== GERANDO HISTÓRIA ===');
        this.log(`Estado atual - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}, capturedText: "${this.capturedText}"`);
        this.log(`Stack trace da chamada:`, new Error().stack);
        
        // Parar qualquer gravação em andamento
        if (this.voiceManager.isRecording) {
            this.log('Parando gravação em andamento...');
            this.voiceManager.stopRecording();
        }
        
        // Esconder botão amarelo
        const createBtn = document.getElementById('create-story-btn');
        if (createBtn) {
            this.log('Escondendo botão amarelo...');
            this.log(`Estado do botão antes: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
            createBtn.style.display = 'none';
            createBtn.classList.remove('visible');
            this.log(`Estado do botão após: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
        }
        
        // Resetar flags
        this.buttonActive = false;
        this.isProcessing = false;
        this.log('Flags resetadas: buttonActive=false, isProcessing=false');
        
        // Gerar história usando o AI Manager
        this.log('Chamando AI Manager para gerar história...');
        this.log(`Texto capturado: "${this.capturedText}"`);
        
        // Passar o texto capturado como parâmetro
        this.aiManager.generateStory({ voiceText: this.capturedText })
            .then(story => {
                this.log('História gerada com sucesso!');
                this.log(`Tipo da história retornada: ${typeof story}`);
                this.displayStory(story);
            })
            .catch(error => {
                this.log(`Erro ao gerar história: ${error}`, 'ERROR');
                this.displayError('Erro ao gerar história. Tente novamente.');
            });
    }

    displayStory(story) {
        this.log('=== EXIBINDO HISTÓRIA ===');
        this.log(`Tipo da história: ${typeof story}`, typeof story === 'object' ? 'WARN' : 'INFO');
        
        if (typeof story === 'object') {
            this.log(`Propriedades da história: ${Object.keys(story).join(', ')}`);
        }
        
        this.showScreen('loading-screen');
        
        // Aguardar um pouco para mostrar a tela de carregamento
        setTimeout(() => {
            const storyScreen = document.getElementById('story-screen');
            const storyTitle = document.getElementById('story-title');
            const storyContent = document.getElementById('story-content');
            
            if (storyScreen && storyTitle && storyContent) {
                this.log('Elementos da história encontrados, configurando...');
                
                // Extrair título e conteúdo da história
                let title = 'História Especial';
                let content = '';
                
                if (typeof story === 'object') {
                    // Formato do AI Manager: { title, paragraphs: [{ text }] }
                    title = story.title || story.name || 'História Especial';
                    
                    if (story.paragraphs && Array.isArray(story.paragraphs)) {
                        // Formato com paragraphs
                        content = story.paragraphs.map(p => 
                            typeof p === 'string' ? p : p.text || p
                        ).join('<br><br>');
                    } else if (story.content) {
                        // Formato com content
                        content = story.content;
                    } else if (story.text) {
                        // Formato com text
                        content = story.text;
                    } else {
                        // Fallback
                        content = JSON.stringify(story);
                    }
                } else {
                    content = story;
                }
                
                storyTitle.textContent = title;
                storyContent.innerHTML = content;
                
                this.showScreen('story-screen');
                this.log('Tela da história exibida');
                
                // Configurar botões da tela de história APÓS a tela ser exibida
                setTimeout(() => {
                    this.setupStoryScreenButtons();
                }, 100);
                
                // Falar a história
                if (this.audioPermissionGranted) {
                    this.log('Narrando história...');
                    // Usar textContent para remover HTML tags na narração
                    const textToSpeak = storyContent.textContent || content;
                    this.voiceManager.speak(textToSpeak, () => {
                        this.log('História narrada com sucesso');
                    });
                } else {
                    this.log('Permissão de áudio perdida, não narrando história', 'WARN');
                }
            } else {
                this.log('ERRO: Elementos da história não encontrados', 'ERROR');
            }
        }, 1000);
    }

    setupStoryScreenButtons() {
        this.log('=== CONFIGURANDO BOTÕES DA TELA DE HISTÓRIA ===');
        
        // Aguardar um pouco para garantir que os elementos estão no DOM
        setTimeout(() => {
            // Botão "Ouvir História"
            const listenBtn = document.getElementById('listen-btn');
            if (listenBtn) {
                this.log('Botão "Ouvir História" encontrado, configurando...');
                listenBtn.onclick = () => {
                    this.log('Botão "Ouvir História" clicado');
                    this.playClickSound();
                    
                    const storyContent = document.getElementById('story-content');
                    if (storyContent && this.audioPermissionGranted) {
                        const textToSpeak = storyContent.textContent;
                        this.log(`Narrando história: "${textToSpeak.substring(0, 50)}..."`);
                        this.voiceManager.speak(textToSpeak, () => {
                            this.log('História narrada novamente');
                        });
                    } else {
                        this.log('ERRO: Conteúdo da história não encontrado ou permissão de áudio perdida', 'ERROR');
                    }
                };
                this.log('✅ Botão "Ouvir História" configurado com sucesso');
            } else {
                this.log('❌ Botão "Ouvir História" não encontrado', 'ERROR');
            }
            
            // Botão "Criar Nova História"
            const newStoryBtn = document.getElementById('new-story-btn');
            if (newStoryBtn) {
                this.log('Botão "Criar Nova História" encontrado, configurando...');
                newStoryBtn.onclick = () => {
                    this.log('Botão "Criar Nova História" clicado');
                    this.playClickSound();
                    this.resetToWelcomeScreen();
                };
                this.log('✅ Botão "Criar Nova História" configurado com sucesso');
            } else {
                this.log('❌ Botão "Criar Nova História" não encontrado', 'ERROR');
            }
            
            // Verificar se ambos os botões foram configurados
            if (listenBtn && newStoryBtn) {
                this.log('✅ Todos os botões da tela de história configurados com sucesso');
            } else {
                this.log('⚠️ Alguns botões não foram encontrados', 'WARN');
            }
        }, 200);
    }

    resetToWelcomeScreen() {
        this.log('=== RESETANDO PARA TELA INICIAL ===');
        
        // Resetar todas as flags
        this.isProcessing = false;
        this.buttonActive = false;
        this.capturedText = '';
        this.userHasInteracted = true; // Manter como true para não pedir interação novamente
        
        // Esconder botão amarelo se estiver visível
        const createBtn = document.getElementById('create-story-btn');
        if (createBtn) {
            createBtn.style.display = 'none';
            createBtn.classList.remove('visible');
        }
        
        // Esconder animação de gravação
        this.hideRecordingAnimation();
        
        // Voltar para tela inicial
        this.showScreen('welcome-screen');
        
        // Iniciar novo fluxo após um pequeno delay
        setTimeout(() => {
            this.log('Iniciando novo fluxo...');
            this.startInteractionLoop();
        }, 1000);
    }

    displayError(message) {
        this.log(`=== ERRO: ${message} ===`, 'ERROR');
        this.showScreen('welcome-screen');
        
        if (this.audioPermissionGranted) {
            this.log('Falando mensagem de erro...');
            this.voiceManager.speak('Ops! Algo deu errado. Vamos tentar novamente?', () => {
                this.log('Mensagem de erro falada, reiniciando em 2s...');
                setTimeout(() => {
                    this.resetFlow();
                    this.startInteractionLoop();
                }, 2000);
            });
        } else {
            this.log('Permissão de áudio perdida, reiniciando em 2s...', 'WARN');
            setTimeout(() => {
                this.resetFlow();
                this.startInteractionLoop();
            }, 2000);
        }
    }

    resetFlow() {
        this.log('=== RESETANDO FLUXO ===');
        this.log(`Estado antes do reset - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}, capturedText: "${this.capturedText}"`);
        this.log(`Stack trace do reset:`, new Error().stack);
        
        this.isProcessing = false;
        this.buttonActive = false;
        this.capturedText = '';
        this.log('Flags resetadas: isProcessing=false, buttonActive=false, capturedText=""');
        
        // Esconder botão amarelo
        const createBtn = document.getElementById('create-story-btn');
        if (createBtn) {
            this.log('Escondendo botão amarelo no reset...');
            this.log(`Estado do botão antes de esconder: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
            createBtn.style.display = 'none';
            createBtn.classList.remove('visible');
            this.log(`Estado do botão após esconder: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
        }
        
        // Esconder animação de gravação
        this.hideRecordingAnimation();
        this.log('Fluxo resetado completamente');
    }

    // Método para monitorar o estado do botão
    startButtonMonitoring() {
        this.log('Iniciando monitoramento do botão amarelo...');
        
        let lastButtonState = {
            display: 'none',
            visible: false,
            buttonActive: false
        };
        
        let buttonVisibleTime = null;
        
        const checkButton = () => {
            const btn = document.getElementById('create-story-btn');
            if (btn) {
                const currentState = {
                    display: btn.style.display,
                    visible: btn.classList.contains('visible'),
                    buttonActive: this.buttonActive
                };
                
                // Verificar se o botão ficou visível
                if (!lastButtonState.visible && currentState.visible) {
                    buttonVisibleTime = Date.now();
                    this.log(`Botão ficou visível às ${buttonVisibleTime - this.startTime}ms`);
                }
                
                // Verificar se o botão sumiu quando deveria estar visível
                if (lastButtonState.visible && !currentState.visible && lastButtonState.buttonActive) {
                    const timeVisible = Date.now() - buttonVisibleTime;
                    this.log(`🚨 BOTÃO SUMIU APÓS ${timeVisible}ms DE VISIBILIDADE!`, 'ERROR');
                    this.log(`Estado anterior: ${JSON.stringify(lastButtonState)}`);
                    this.log(`Estado atual: ${JSON.stringify(currentState)}`);
                    this.log(`Stack trace:`, new Error().stack);
                    
                    // Verificar se há algum CSS que possa estar escondendo o botão
                    const computedStyle = window.getComputedStyle(btn);
                    this.log(`CSS computed: display=${computedStyle.display}, visibility=${computedStyle.visibility}, opacity=${computedStyle.opacity}`);
                    
                    // Verificar se o botão ainda está no DOM
                    if (document.body.contains(btn)) {
                        this.log('Botão ainda está no DOM');
                    } else {
                        this.log('ERRO: Botão foi removido do DOM!', 'ERROR');
                    }
                }
                
                // Verificar se houve mudança no estado
                if (JSON.stringify(currentState) !== JSON.stringify(lastButtonState)) {
                    this.log(`MUDANÇA NO ESTADO DO BOTÃO DETECTADA:`, 'WARN');
                    this.log(`Estado anterior: ${JSON.stringify(lastButtonState)}`);
                    this.log(`Estado atual: ${JSON.stringify(currentState)}`);
                    this.log(`Stack trace da mudança:`, new Error().stack);
                    
                    // Se o botão deveria estar visível mas não está
                    if (currentState.buttonActive && (!currentState.visible || currentState.display === 'none')) {
                        this.log('🚨 ALERTA CRÍTICO: Botão deveria estar visível mas não está!', 'ERROR');
                        this.log(`Tempo desde a última verificação: ${Date.now() - this.startTime}ms`);
                        this.log(`Stack trace:`, new Error().stack);
                    }
                }
            }
        };
        
        setInterval(checkButton, 100);
    }

    forceButtonVisible() {
        this.log('Forçando botão amarelo a ficar visível...');
        const createBtn = document.getElementById('create-story-btn');
        if (createBtn) {
            this.log('Botão encontrado, configurando...');
            this.log(`Estado do botão antes: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
            
            createBtn.style.display = 'block';
            createBtn.style.visibility = 'visible';
            createBtn.style.opacity = '1';
            createBtn.style.transform = 'translateY(0)';
            
            // Forçar reflow antes de adicionar a classe
            createBtn.offsetHeight;
            
            createBtn.classList.add('visible');
            createBtn.onclick = () => {
                this.log('=== BOTÃO AMARELO CLICADO ===');
                this.playClickSound();
                this.generateStory();
            };
            
            // Marcar que o botão está ativo para evitar que seja resetado
            this.buttonActive = true;
            this.log(`Botão amarelo ativo, aguardando clique do usuário...`);
            this.log(`Estado após configurar botão - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}`);
            this.log(`Estado do botão após: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
        } else {
            this.log('ERRO: Botão amarelo não encontrado!', 'ERROR');
        }
    }

    fixCSSIssues() {
        this.log('Corrigindo problemas de CSS...');
        const createBtn = document.getElementById('create-story-btn');
        if (createBtn) {
            this.log('Botão encontrado, corrigindo...');
            this.log(`Estado do botão antes: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
            
            createBtn.style.display = 'block';
            createBtn.style.visibility = 'visible';
            createBtn.style.opacity = '1';
            createBtn.style.transform = 'translateY(0)';
            
            // Forçar reflow antes de adicionar a classe
            createBtn.offsetHeight;
            
            createBtn.classList.add('visible');
            createBtn.onclick = () => {
                this.log('=== BOTÃO AMARELO CLICADO ===');
                this.playClickSound();
                this.generateStory();
            };
            
            // Marcar que o botão está ativo para evitar que seja resetado
            this.buttonActive = true;
            this.log(`Botão amarelo ativo, aguardando clique do usuário...`);
            this.log(`Estado após configurar botão - buttonActive: ${this.buttonActive}, isProcessing: ${this.isProcessing}`);
            this.log(`Estado do botão após: display=${createBtn.style.display}, visible=${createBtn.classList.contains('visible')}`);
        } else {
            this.log('ERRO: Botão amarelo não encontrado!', 'ERROR');
        }
    }

    showScreen(screenId) {
        this.log(`Mostrando tela: ${screenId}`);
        this.screenManager.showScreen(screenId);
    }

    showRecordingAnimation() {
        this.log('Mostrando animação de gravação...');
        const listeningAnimation = document.getElementById('listening-animation');
        if (listeningAnimation) {
            listeningAnimation.style.display = 'block';
            this.log('Animação de gravação exibida');
        } else {
            this.log('ERRO: Animação de gravação não encontrada', 'ERROR');
        }
    }

    hideRecordingAnimation() {
        this.log('Escondendo animação de gravação...');
        const listeningAnimation = document.getElementById('listening-animation');
        if (listeningAnimation) {
            listeningAnimation.style.display = 'none';
            this.log('Animação de gravação escondida');
        } else {
            this.log('ERRO: Animação de gravação não encontrada para esconder', 'ERROR');
        }
    }

    checkActiveTimeouts() {
        this.log('=== VERIFICANDO TIMEOUTS ATIVOS ===');
        this.log(`currentTimeout: ${this.currentTimeout ? 'ATIVO' : 'null'}`);
        this.log(`isProcessing: ${this.isProcessing}`);
        this.log(`buttonActive: ${this.buttonActive}`);
        this.log(`capturedText: "${this.capturedText}"`);
        
        if (this.currentTimeout) {
            this.log('Timeout ativo encontrado, limpando...');
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new CriamundoApp();
});