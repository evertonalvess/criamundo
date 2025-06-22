class CriamundoApp {
    constructor() {
        this.voiceManager = new VoiceManager();
        this.aiManager = new AIManager();
        this.screenManager = new ScreenManager();
        this.audioPermissionGranted = false;
        this.audioUnlocked = false;
        this.userHasInteracted = false;
        this.isProcessing = false;
        this.buttonActive = false;
        this.capturedText = '';
        this.currentTimeout = null;
        this.audioUnlocked = false;

        
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
        // Manter apenas o botão de atalho para a história
        const playBtn = document.createElement('button');
        playBtn.textContent = '▶️'; // Apenas o ícone de play
        playBtn.setAttribute('aria-label', 'Ir para História'); // Para acessibilidade
        playBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #20c997;
            color: white;
            border: none;
            padding: 10px 15px; /* Ajuste no padding para um visual mais quadrado */
            border-radius: 50%; /* Botão redondo */
            cursor: pointer;
            font-size: 18px; /* Tamanho do ícone */
            line-height: 1; /* Alinhamento do ícone */
            width: 48px; /* Largura fixa */
            height: 48px; /* Altura fixa */
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        playBtn.onclick = async () => {
            this.log('Botão de debug "Ir para História" clicado.');
            // Usar o AIManager para gerar uma história de fallback
            const story = await this.aiManager.generateFallbackStory();
            // Exibir a história diretamente
            this.displayStory(story);
        };
        document.body.appendChild(playBtn);
        this.log('Botão de debug "Ir para História" adicionado.');

        // Parar narração ao recarregar ou fechar a página
        window.addEventListener('beforeunload', () => {
            this.voiceManager.stop();
        });
    }

    setupUserInteraction() {
        this.log('Configurando detecção de interação do usuário...');
        
        const handleInteraction = () => {
            if (!this.userHasInteracted) {
                this.unlockAudio(); // DESBLOQUEIA O ÁUDIO NA PRIMEIRA INTERAÇÃO
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
                    this.unlockAudio();
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

    async confirmAndProceed() {
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

    async generateStory() {
        if (this.isProcessing) return;
        this.log('Iniciando geração de história...');
        this.isProcessing = true;
        
        this.screenManager.showScreen('loading-screen');
        
        try {
            const userPrompt = this.capturedText || 'Crie uma história sobre um dragão amigável e uma fada curiosa.';
            this.log(`Prompt para IA: "${userPrompt}"`);
            
            const story = await this.aiManager.generateStory({ voiceText: userPrompt });

            // Se for uma história de fallback, adiciona um delay para UX
            if (story.isFallback) {
                this.log('Fallback detectado, aguardando 3s para uma melhor UX.');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            if (story && story.title && story.story) {
                this.log('História gerada com sucesso!', 'SUCCESS');
                this.displayStory(story);
            } else {
                throw new Error('A resposta da IA não continha uma história válida.');
            }
            
        } catch (error) {
            this.log(`Erro ao gerar história: ${error.message}`, 'ERROR');
            this.displayError('Oops! Não conseguimos criar sua história. Tente novamente!');
            setTimeout(() => this.resetToWelcomeScreen(), 3000);
        } finally {
            this.isProcessing = false;
        }
    }

    displayStory(story) {
        this.log('=== EXIBINDO HISTÓRIA ===');
        this.log(`Tipo da história: ${typeof story}`, 'WARN');
        if (story && story.title && story.story) {
            this.log('Propriedades da história: ' + Object.keys(story).join(', '));

            // 1. Mostrar a tela da história PRIMEIRO
            this.screenManager.showScreen('story-screen');

            // 2. Preencher o conteúdo AGORA que a tela está visível
            try {
                const storyTitleEl = document.getElementById('story-title');
                const storyTextEl = document.getElementById('story-text');

                if (storyTitleEl && storyTextEl) {
                    storyTitleEl.textContent = story.title;
                    storyTextEl.innerHTML = story.story.replace(/\\n/g, '<br><br>');
                } else {
                    throw new Error('Elementos #story-title ou #story-text não encontrados no DOM.');
                }
            } catch (error) {
                this.log(error.message, 'ERROR');
                this.displayError('Ocorreu um problema ao tentar mostrar a história.');
                this.resetToWelcomeScreen();
                return;
            }

            // 3. Configurar os botões
            this.setupStoryScreenButtons(story);

        } else {
            this.log('Objeto de história inválido recebido.', 'ERROR');
            this.displayError('A história recebida estava vazia ou mal formatada.');
            this.resetToWelcomeScreen();
        }
    }

    setupStoryScreenButtons(story) {
        if (this.storyScreenButtonsConfigured) {
            this.log('Botões da tela de história já configurados. Pulando.');
            return;
        }
        this.log('Configurando botões da tela de história (Ouvir de novo, Voltar)...');

        const replayBtn = document.getElementById('listen-story-btn');
        const backBtn = document.getElementById('back-from-story-btn');

        if (replayBtn) {
            replayBtn.onclick = () => {
                this.log('Botão "Ouvir de novo" clicado.');
                this.playStoryAudio();
            };
        } else {
            this.log('Botão "Ouvir de novo" (listen-story-btn) não encontrado.', 'WARN');
        }

        if (backBtn) {
            backBtn.onclick = () => {
                this.log('Botão "Voltar" clicado. Forçando um recarregamento completo da página.');
                // O argumento 'true' força o navegador a recarregar a página do servidor,
                // ignorando o cache. É a forma mais robusta de "resetar" a aplicação.
                location.reload(true);
            };
        } else {
            this.log('Botão "Voltar" (back-from-story-btn) não encontrado.', 'WARN');
        }

        this.storyScreenButtonsConfigured = true;
        this.log('Botões da tela de história configurados.');
    }

    resetToWelcomeScreen() {
        this.log('=== RESETANDO PARA TELA DE BOAS-VINDAS ===');
        // 1. Parar qualquer áudio e resetar todas as flags de estado.
        this.voiceManager.stop();
        this.resetFlow();

        // 2. Mudar para a tela de boas-vindas.
        this.screenManager.showScreen('welcome-screen');
        
        // 3. Iniciar o novo ciclo de interação APÓS uma pequena pausa.
        // Isso evita conflitos com a animação de transição de tela.
        setTimeout(() => {
            this.log('Reiniciando o ciclo de interação após o reset.');
            this.startInteractionLoop();
        }, 500);
    }

    displayError(message) {
        this.log(`ERRO: ${message}`, 'ERROR');
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
        this.isProcessing = false;
        this.buttonActive = false;
        this.capturedText = '';
        this.storyScreenButtonsConfigured = false; // Garante que os botões da história possam ser reconfigurados
        
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

    unlockAudio() {
        if (this.audioUnlocked) return;
        this.log('Tentando desbloquear o áudio para o navegador...');
        const silentSound = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
        silentSound.volume = 0;
        silentSound.play().then(() => {
            this.audioUnlocked = true;
            this.log('Contexto de áudio desbloqueado com sucesso.', 'SUCCESS');
        }).catch(e => {
            this.log(`Desbloqueio de áudio falhou: ${e.message}`, 'WARN');
        });
    }
}

// Garantir que a aplicação seja inicializada apenas uma vez (Padrão Singleton)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.criamundoAppInstance) {
        console.log('Criando nova instância do CriamundoApp.');
        window.criamundoAppInstance = new CriamundoApp();
    } else {
        console.log('Instância do CriamundoApp já existe. Ignorando nova criação.');
    }
});