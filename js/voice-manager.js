/**
 * Voice Manager - Gerenciador de Reconhecimento de Voz
 * Responsável por capturar e processar entrada de voz
 */

class VoiceManager {
    constructor() {
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.onStartCallback = null;
        this.onEndCallback = null;
        this.init();
    }

    init() {
        this.initSpeechRecognition();
        this.initSpeechSynthesis();
    }

    /**
     * Inicializa o reconhecimento de voz
     */
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Reconhecimento de voz não suportado neste navegador');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configurações
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'pt-BR';

        // Event listeners
        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('Reconhecimento de voz iniciado');
            if (this.onStartCallback) this.onStartCallback();
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

            if (finalTranscript) {
                console.log('Texto final:', finalTranscript);
                if (this.onResultCallback) this.onResultCallback(finalTranscript);
            }

            // Mostrar texto intermediário
            this.updateInterimText(interimTranscript);
        };

        this.recognition.onerror = (event) => {
            console.error('Erro no reconhecimento de voz:', event.error);
            this.isListening = false;
            if (this.onErrorCallback) this.onErrorCallback(event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('Reconhecimento de voz finalizado');
            if (this.onEndCallback) this.onEndCallback();
        };
    }

    /**
     * Inicializa a síntese de voz
     */
    initSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            console.warn('Síntese de voz não suportada neste navegador');
            return;
        }

        this.synthesis = window.speechSynthesis;
    }

    /**
     * Inicia o reconhecimento de voz
     */
    startListening() {
        if (!this.recognition) {
            console.error('Reconhecimento de voz não disponível');
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Erro ao iniciar reconhecimento:', error);
            return false;
        }
    }

    /**
     * Para o reconhecimento de voz
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Fala um texto
     */
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.error('Síntese de voz não disponível');
            return false;
        }

        // Parar qualquer fala em andamento
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configurações padrão
        utterance.lang = 'pt-BR';
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        // Selecionar voz em português se disponível
        const voices = this.synthesis.getVoices();
        const portugueseVoice = voices.find(voice => 
            voice.lang.startsWith('pt') || voice.lang.startsWith('pt-BR')
        );
        
        if (portugueseVoice) {
            utterance.voice = portugueseVoice;
        }

        // Event listeners
        utterance.onstart = () => {
            this.isSpeaking = true;
            console.log('Iniciando fala:', text);
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            console.log('Fala finalizada');
        };

        utterance.onerror = (event) => {
            this.isSpeaking = false;
            console.error('Erro na síntese de voz:', event.error);
        };

        this.synthesis.speak(utterance);
        return true;
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