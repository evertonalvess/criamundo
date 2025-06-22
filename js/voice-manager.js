/**
 * Voice Manager - Gerenciador de Reconhecimento de Voz
 * Responsável por capturar e processar entrada de voz
 */

class VoiceManager {
    constructor() {
        this.log('=== INICIANDO VOICE MANAGER ===');
        
        this.recognition = null;
        this.isRecognitionSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        this.isSynthesisSupported = ('speechSynthesis' in window);
        this.isListening = false; // Flag para controlar estado do reconhecimento
        this.isRecording = false;
        this.audioChunks = [];
        this.recordingTimeout = null;
        
        this.log(`Reconhecimento suportado: ${this.isRecognitionSupported}`);
        this.log(`Síntese suportada: ${this.isSynthesisSupported}`);
        
        this.init();
    }

    log(message, type = 'INFO') {
        const timestamp = Date.now();
        const logEntry = `[${timestamp}ms] [VOICE-MANAGER] [${type}] ${message}`;
        console.log(logEntry);
        
        if (type === 'ERROR') {
            console.error(logEntry);
        } else if (type === 'WARN') {
            console.warn(logEntry);
        }
    }

    init() {
        this.log('Inicializando Voice Manager...');
        
        if (this.isRecognitionSupported) {
            this.log('Reconhecimento de voz disponível');
            this.initSpeechRecognition();
        } else {
            this.log('Reconhecimento de voz não suportado', 'ERROR');
        }
        
        if (this.isSynthesisSupported) {
            this.log('Síntese de voz disponível');
            this.initSpeechSynthesis();
        } else {
            this.log('Síntese de voz não suportada', 'ERROR');
        }
    }

    /**
     * Inicializa o reconhecimento de voz
     */
    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'pt-BR';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
    }

    /**
     * Inicializa a síntese de voz
     */
    initSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            console.warn('Síntese de voz não suportada neste navegador');
            return;
        }
    }

    /**
     * Inicia o reconhecimento de voz
     */
    startRecording() {
        this.log('=== INICIANDO GRAVAÇÃO ===');
        
        if (this.isRecording) {
            this.log('Já está gravando, ignorando nova chamada', 'WARN');
            return;
        }

        this.isRecording = true;
        this.audioChunks = [];
        this.log('Flags de gravação configuradas');
        
        // Configurar reconhecimento de voz
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'pt-BR';
        
        // Aumentar o tempo de gravação para capturar melhor a fala da criança
        this.recognition.maxAlternatives = 3;
        this.log('Reconhecimento configurado: contínuo, resultados intermediários, pt-BR');
        
        // Configurar timeout mais longo para crianças
        this.recordingTimeout = setTimeout(() => {
            this.log('Timeout de gravação atingido (20s)', 'WARN');
            this.stopRecording();
        }, 20000); // 20 segundos para dar tempo da criança falar
        
        this.recognition.onstart = () => {
            this.log('Reconhecimento de voz iniciado');
            this.onRecordingStart && this.onRecordingStart();
        };
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            this.log(`Resultado processado - Final: "${finalTranscript}" | Intermediário: "${interimTranscript}"`);
            
            // Atualizar callback com resultados
            if (this.onResult) {
                this.onResult(finalTranscript, interimTranscript);
            }
            
            // Se temos resultado final, aguardar um pouco mais antes de parar
            if (finalTranscript.trim()) {
                this.log('Resultado final detectado, aguardando 2 segundos antes de parar...');
                clearTimeout(this.recordingTimeout);
                this.recordingTimeout = setTimeout(() => {
                    this.log('Parando gravação após resultado final');
                    this.stopRecording();
                }, 2000); // Aguardar 2 segundos após resultado final
            }
        };
        
        this.recognition.onerror = (event) => {
            this.log(`Erro no reconhecimento de voz: ${event.error}`, 'ERROR');
            this.isRecording = false;
            this.onError && this.onError(event.error);
        };
        
        this.recognition.onend = () => {
            this.log('Reconhecimento de voz finalizado');
            this.isRecording = false;
            clearTimeout(this.recordingTimeout);
            this.onRecordingEnd && this.onRecordingEnd();
        };
        
        try {
            this.log('Iniciando reconhecimento de voz...');
            this.recognition.start();
        } catch (error) {
            this.log(`Erro ao iniciar reconhecimento: ${error}`, 'ERROR');
            this.isRecording = false;
            this.onError && this.onError(error);
        }
    }

    /**
     * Para o reconhecimento de voz
     */
    stopRecording() {
        this.log('=== PARANDO GRAVAÇÃO ===');
        
        if (this.recognition && this.isRecording) {
            try {
                this.log('Parando reconhecimento de voz...');
                this.recognition.stop();
                this.isRecording = false;
                this.log('Gravação parada com sucesso');
            } catch (error) {
                this.log(`Erro ao parar reconhecimento: ${error}`, 'ERROR');
            }
        } else {
            this.log('Nenhuma gravação ativa para parar', 'WARN');
        }
    }

    /**
     * Fala um texto
     */
    speak(text, onEndCallback) {
        this.log(`=== INICIANDO SÍNTESE DE VOZ ===`);
        this.log(`Texto a falar: "${text}"`);
        
        if (!this.isSynthesisSupported) {
            this.log('Síntese de voz não suportada', 'ERROR');
            if (onEndCallback) onEndCallback();
            return;
        }

        // Parar fala anterior se estiver ativa
        if (this.isSpeaking) {
            this.log('Parando fala anterior...');
            this.stopSpeaking();
        }

        this.performSpeak(text, onEndCallback);
    }

    performSpeak(text, onEndCallback) {
        this.log('Executando síntese de voz...');
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;

        const ptVoice = speechSynthesis.getVoices().find(voice => voice.lang === 'pt-BR');
        if (ptVoice) {
            utterance.voice = ptVoice;
            this.log('Voz em português configurada');
        } else {
            this.log('Voz em português não encontrada, usando padrão', 'WARN');
        }

        utterance.onend = () => {
            this.log('Síntese de voz finalizada');
            if (onEndCallback) onEndCallback();
        };
        
        utterance.onerror = (event) => {
            this.log(`Erro na síntese de voz: ${event.error}`, 'ERROR');
            
            // Se for erro de permissão, tentar reativar
            if (event.error === 'not-allowed') {
                this.log('Tentando reativar síntese de voz...', 'WARN');
                // Tentar falar novamente após um pequeno delay
                setTimeout(() => {
                    try {
                        speechSynthesis.speak(utterance);
                    } catch (retryError) {
                        this.log(`Falha na segunda tentativa: ${retryError}`, 'ERROR');
                        if (onEndCallback) onEndCallback();
                    }
                }, 100);
            } else if (event.error === 'interrupted') {
                this.log('Síntese interrompida, tentando novamente...', 'WARN');
                // Tentar falar novamente após um delay maior
                setTimeout(() => {
                    try {
                        speechSynthesis.speak(utterance);
                    } catch (retryError) {
                        this.log(`Falha na segunda tentativa: ${retryError}`, 'ERROR');
                        if (onEndCallback) onEndCallback();
                    }
                }, 500);
            } else {
                if (onEndCallback) onEndCallback();
            }
        };

        try {
            this.log('Iniciando síntese de voz...');
            speechSynthesis.speak(utterance);
        } catch (error) {
            this.log(`Erro ao iniciar síntese de voz: ${error}`, 'ERROR');
            if (onEndCallback) onEndCallback();
        }
    }

    /**
     * Para a fala
     */
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    /**
     * Atualiza o texto intermediário na interface
     */
    updateInterimText(text) {
        const interimElement = document.getElementById('interim-text');
        if (interimElement) {
            if (text) {
                interimElement.textContent = text;
                interimElement.style.display = 'block';
            } else {
                interimElement.style.display = 'none';
            }
        }
    }

    /**
     * Processa o texto falado para gerar parâmetros da história
     */
    processVoiceInput(text) {
        const lowerText = text.toLowerCase();
        
        // Extrair tema
        const themes = [
            'amizade', 'coragem', 'cooperação', 'criatividade', 
            'perseverança', 'bondade', 'responsabilidade', 'curiosidade'
        ];
        
        const detectedTheme = themes.find(theme => lowerText.includes(theme));
        
        // Extrair personagens
        const characterKeywords = {
            'gato': 'um gato',
            'cachorro': 'um cachorro',
            'dragão': 'um dragão',
            'fada': 'uma fada',
            'princesa': 'uma princesa',
            'príncipe': 'um príncipe',
            'unicórnio': 'um unicórnio',
            'coruja': 'uma coruja',
            'leão': 'um leão',
            'rato': 'um rato',
            'criança': 'uma criança',
            'menino': 'um menino',
            'menina': 'uma menina'
        };
        
        const detectedCharacters = [];
        for (const [keyword, character] of Object.entries(characterKeywords)) {
            if (lowerText.includes(keyword)) {
                detectedCharacters.push(character);
            }
        }

        // Extrair cenário
        const scenarios = [
            'floresta', 'castelo', 'espaço', 'oceano', 'montanha', 
            'cidade', 'escola', 'casa', 'jardim', 'praia'
        ];
        
        const detectedScenario = scenarios.find(scenario => lowerText.includes(scenario));

        return {
            tema: detectedTheme || 'amizade',
            personagens: detectedCharacters.length > 0 ? detectedCharacters.join(' e ') : 'personagens mágicos',
            cenario: detectedScenario || 'mundo mágico',
            textoOriginal: text
        };
    }

    /**
     * Verifica se o reconhecimento de voz está disponível
     */
    isRecognitionAvailable() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    /**
     * Verifica se a síntese de voz está disponível
     */
    isSynthesisAvailable() {
        return !!window.speechSynthesis;
    }

    /**
     * Define callback para resultado do reconhecimento
     */
    onResult(callback) {
        this.onResultCallback = callback;
    }

    /**
     * Define callback para erro do reconhecimento
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }

    /**
     * Define callback para início do reconhecimento
     */
    onStart(callback) {
        this.onStartCallback = callback;
    }

    /**
     * Define callback para fim do reconhecimento
     */
    onEnd(callback) {
        this.onEndCallback = callback;
    }

    /**
     * Obtém status atual
     */
    getStatus() {
        return {
            isListening: this.isListening,
            isSpeaking: this.isSpeaking,
            recognitionAvailable: this.isRecognitionAvailable(),
            synthesisAvailable: this.isSynthesisAvailable()
        };
    }

    /**
     * Limpa todos os callbacks
     */
    clearCallbacks() {
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.onStartCallback = null;
        this.onEndCallback = null;
    }
}

// Exportar para uso global
window.VoiceManager = VoiceManager; 