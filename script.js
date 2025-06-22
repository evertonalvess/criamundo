// Dados da história de exemplo
const storyData = {
    title: "O Dragão Estelar e a Fada Azul",
    paragraphs: [
        "Era uma vez um dragão brilhante chamado Draco, que morava numa estrela cadente no céu. Seu lar era feito de poeira cósmica e luz colorida, e ele adorava voar entre os planetas brincando de esconde-esconde com os cometas.",
        
        "Um dia, enquanto voava perto de Saturno, Draco encontrou uma fada azul chamada Luma. Ela carregava uma varinha feita de gelo lunar e tinha asas que brilhavam como diamantes. Luma estava procurando um lugar para plantar estrelas novas.",
        
        "Draco e Luma se tornaram grandes amigos. Juntos, eles criaram constelações no céu noturno desenhando com poeira de estrelas. Cada desenho virava uma história para as crianças da Terra.",
        
        "Mas um dia, uma nuvem escura cobriu parte do espaço, escondendo a luz das constelações. As crianças ficaram tristes sem ver as formas no céu.",
        
        "Então, Draco soprou seu fogo estelar bem alto, e Luma girou sua varinha. A luz voltou, mais forte do que antes, e o céu ficou cheio de novas formas brilhantes!",
        
        "Desde então, toda noite, Draco e Luma criam novas histórias no céu, para quem quiser sonhar olhando para as estrelas."
    ]
};

// Sistema de navegação entre telas
class ScreenManager {
    constructor() {
        this.screens = {
            home: document.getElementById('home-screen'),
            voiceCapture: document.getElementById('voice-capture-screen'),
            aiConfig: document.getElementById('ai-config-screen'),
            loading: document.getElementById('loading-screen'),
            story: document.getElementById('story-screen'),
            saveShare: document.getElementById('save-share-screen')
        };
        this.currentScreen = 'home';
        this.aiManager = null;
        this.voiceManager = null;
        this.currentStory = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadStory();
        this.initManagers();
    }

    async initManagers() {
        // Inicializar AI Manager
        this.aiManager = new AIManager();
        
        // Inicializar Voice Manager
        this.voiceManager = new VoiceManager();
        
        // Configurar callbacks do Voice Manager
        this.voiceManager.onResult((text) => {
            this.handleVoiceResult(text);
        });
        
        this.voiceManager.onError((error) => {
            this.handleVoiceError(error);
        });
        
        this.voiceManager.onStart(() => {
            this.handleVoiceStart();
        });
        
        this.voiceManager.onEnd(() => {
            this.handleVoiceEnd();
        });
    }

    setupEventListeners() {
        // Botões da tela inicial
        document.getElementById('create-story-btn').addEventListener('click', () => {
            this.showScreen('voiceCapture');
        });

        document.getElementById('create-story-ai-btn').addEventListener('click', () => {
            this.showScreen('aiConfig');
        });

        // Botões da tela de voz
        document.getElementById('back-from-voice-btn').addEventListener('click', () => {
            this.showScreen('home');
        });

        document.getElementById('start-voice-btn').addEventListener('click', () => {
            this.startVoiceCapture();
        });

        document.getElementById('stop-voice-btn').addEventListener('click', () => {
            this.stopVoiceCapture();
        });

        document.getElementById('generate-from-voice-btn').addEventListener('click', () => {
            this.generateStoryFromVoice();
        });

        // Botões da tela de IA
        document.getElementById('back-from-ai-btn').addEventListener('click', () => {
            this.showScreen('home');
        });

        document.getElementById('generate-ai-story-btn').addEventListener('click', () => {
            this.generateAIStory();
        });

        document.getElementById('random-story-btn').addEventListener('click', () => {
            this.generateRandomStory();
        });

        // Botões da tela de história
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showScreen('home');
        });

        document.getElementById('listen-btn').addEventListener('click', () => {
            this.playStoryAudio();
        });

        document.getElementById('save-share-btn').addEventListener('click', () => {
            this.showScreen('saveShare');
        });

        document.getElementById('new-story-btn').addEventListener('click', () => {
            this.showScreen('home');
        });

        // Botões da tela de salvar/compartilhar
        document.getElementById('back-to-story-btn').addEventListener('click', () => {
            this.showScreen('story');
        });

        // Botões de ação na tela de salvar/compartilhar
        const actionButtons = document.querySelectorAll('.action-options .btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleActionButton(e.target.closest('.btn'));
            });
        });
    }

    showScreen(screenName) {
        // Esconder tela atual
        this.screens[this.currentScreen].classList.remove('active');
        
        // Mostrar nova tela
        this.screens[screenName].classList.add('active');
        this.currentScreen = screenName;

        // Animações específicas
        if (screenName === 'story') {
            this.animateStoryElements();
        }
    }

    // Métodos de captura de voz
    startVoiceCapture() {
        if (this.voiceManager && this.voiceManager.isRecognitionAvailable()) {
            const success = this.voiceManager.startListening();
            if (success) {
                document.getElementById('start-voice-btn').style.display = 'none';
                document.getElementById('stop-voice-btn').style.display = 'flex';
                this.showMessage('🎤 Comece a falar!');
            } else {
                this.showMessage('❌ Erro ao iniciar reconhecimento de voz');
            }
        } else {
            this.showMessage('❌ Reconhecimento de voz não disponível neste navegador');
        }
    }

    stopVoiceCapture() {
        if (this.voiceManager) {
            this.voiceManager.stopListening();
            document.getElementById('start-voice-btn').style.display = 'flex';
            document.getElementById('stop-voice-btn').style.display = 'none';
        }
    }

    handleVoiceResult(text) {
        document.getElementById('voice-transcript').textContent = text;
        document.getElementById('voice-result').style.display = 'block';
        this.showMessage('✅ Voz capturada com sucesso!');
    }

    handleVoiceError(error) {
        console.error('Erro no reconhecimento de voz:', error);
        this.showMessage('❌ Erro no reconhecimento de voz. Tente novamente.');
        this.stopVoiceCapture();
    }

    handleVoiceStart() {
        console.log('Reconhecimento de voz iniciado');
    }

    handleVoiceEnd() {
        console.log('Reconhecimento de voz finalizado');
        document.getElementById('start-voice-btn').style.display = 'flex';
        document.getElementById('stop-voice-btn').style.display = 'none';
    }

    async generateStoryFromVoice() {
        const transcript = document.getElementById('voice-transcript').textContent;
        if (!transcript) {
            this.showMessage('❌ Nenhum texto capturado');
            return;
        }

        // Processar entrada de voz
        const voiceParams = this.voiceManager.processVoiceInput(transcript);
        
        // Mostrar tela de carregamento
        this.showLoadingScreen('Gerando história a partir da sua voz...');
        
        // Gerar história com IA
        try {
            const story = await this.aiManager.generateStory(voiceParams);
            this.currentStory = story;
            this.showScreen('story');
            this.loadStory();
        } catch (error) {
            console.error('Erro ao gerar história:', error);
            this.showMessage('❌ Erro ao gerar história. Usando história de exemplo.');
            this.currentStory = this.getFallbackStory();
            this.showScreen('story');
            this.loadStory();
        }
    }

    // Métodos de geração de IA
    async generateAIStory() {
        const theme = document.getElementById('story-theme').value;
        const characters = document.getElementById('story-characters').value;
        const scenario = document.getElementById('story-scenario').value;

        if (!theme && !characters && !scenario) {
            this.showMessage('❌ Selecione pelo menos uma opção');
            return;
        }

        const params = {};
        if (theme) params.tema = theme;
        if (characters) params.personagens = characters;
        if (scenario) params.cenario = scenario;

        this.showLoadingScreen('Criando história mágica com IA...');
        
        try {
            const story = await this.aiManager.generateStory(params);
            this.currentStory = story;
            this.showScreen('story');
            this.loadStory();
        } catch (error) {
            console.error('Erro ao gerar história com IA:', error);
            this.showMessage('❌ Erro ao gerar história. Usando história de exemplo.');
            this.currentStory = this.getFallbackStory();
            this.showScreen('story');
            this.loadStory();
        }
    }

    async generateRandomStory() {
        this.showLoadingScreen('Criando história surpresa...');
        
        try {
            const story = await this.aiManager.generateStory();
            this.currentStory = story;
            this.showScreen('story');
            this.loadStory();
        } catch (error) {
            console.error('Erro ao gerar história aleatória:', error);
            this.showMessage('❌ Erro ao gerar história. Usando história de exemplo.');
            this.currentStory = this.getFallbackStory();
            this.showScreen('story');
            this.loadStory();
        }
    }

    showLoadingScreen(message = 'Criando sua história mágica...') {
        this.showScreen('loading');
        document.getElementById('loading-title').textContent = message;
        
        // Atualizar mensagens de carregamento
        if (this.aiManager) {
            const loadingMessages = this.aiManager.getLoadingMessages();
            let currentMessageIndex = 0;
            
            const messageInterval = setInterval(() => {
                if (currentMessageIndex < loadingMessages.length) {
                    document.getElementById('loading-text').textContent = loadingMessages[currentMessageIndex];
                    currentMessageIndex++;
                } else {
                    clearInterval(messageInterval);
                }
            }, 2000);
        }
        
        // Simular processo de carregamento
        setTimeout(() => {
            this.showScreen('story');
        }, 5000);
    }

    loadStory() {
        const story = this.currentStory || storyData;
        
        // Carregar título da história
        document.getElementById('story-title').textContent = story.title;
        document.getElementById('preview-title').textContent = story.title;

        // Carregar fonte da história
        const storySource = document.getElementById('story-source');
        if (story.metadata && story.metadata.generatedBy) {
            storySource.textContent = story.metadata.generatedBy.toUpperCase();
        } else {
            storySource.textContent = 'EXEMPLO';
        }

        // Carregar parágrafos da história
        const storyContainer = document.getElementById('story-paragraphs');
        storyContainer.innerHTML = '';

        const paragraphs = story.paragraphs || storyData.paragraphs;
        paragraphs.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = typeof paragraph === 'string' ? paragraph : paragraph.text;
            storyContainer.appendChild(p);
        });
    }

    animateStoryElements() {
        // Animar elementos da história
        const storyElements = document.querySelectorAll('.story-illustration-large > div');
        storyElements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.5}s`;
        });
    }

    playStoryAudio() {
        const listenBtn = document.getElementById('listen-btn');
        const originalText = listenBtn.querySelector('.btn-text').textContent;
        const originalIcon = listenBtn.querySelector('.btn-icon').textContent;

        // Simular reprodução de áudio
        listenBtn.disabled = true;
        listenBtn.querySelector('.btn-text').textContent = 'Reproduzindo...';
        listenBtn.querySelector('.btn-icon').textContent = '🔊';

        // Usar síntese de voz se disponível
        if (this.voiceManager && this.voiceManager.isSynthesisAvailable()) {
            const story = this.currentStory || storyData;
            const fullText = story.paragraphs.map(p => 
                typeof p === 'string' ? p : p.text
            ).join(' ');
            
            this.voiceManager.speak(fullText, { rate: 0.8 });
            
            // Calcular duração aproximada
            const wordCount = fullText.split(' ').length;
            const audioDuration = (wordCount / 3) * 1000; // ~3 palavras por segundo
            
            setTimeout(() => {
                listenBtn.disabled = false;
                listenBtn.querySelector('.btn-text').textContent = originalText;
                listenBtn.querySelector('.btn-icon').textContent = originalIcon;
                this.showMessage('História reproduzida com sucesso! 🎉');
            }, audioDuration);
        } else {
            // Fallback para simulação
            const story = this.currentStory || storyData;
            const audioDuration = (story.paragraphs.length * 2000);
            
            setTimeout(() => {
                listenBtn.disabled = false;
                listenBtn.querySelector('.btn-text').textContent = originalText;
                listenBtn.querySelector('.btn-icon').textContent = originalIcon;
                this.showMessage('História reproduzida com sucesso! 🎉');
            }, audioDuration);
        }
    }

    handleActionButton(button) {
        const buttonText = button.querySelector('.btn-text').textContent;
        
        switch(buttonText) {
            case 'Salvar História':
                this.saveStory();
                break;
            case 'Compartilhar':
                this.shareStory();
                break;
            case 'Imprimir':
                this.printStory();
                break;
        }
    }

    saveStory() {
        // Simular salvamento
        this.showMessage('História salva com sucesso! 💾');
        
        // Simular download
        setTimeout(() => {
            const story = this.currentStory || storyData;
            const storyContent = this.generateStoryContent(story);
            this.downloadFile(storyContent, `${story.title}.txt`, 'text/plain');
        }, 1000);
    }

    shareStory() {
        // Simular compartilhamento
        if (navigator.share) {
            const story = this.currentStory || storyData;
            navigator.share({
                title: story.title,
                text: story.paragraphs[0] || story.paragraphs[0].text,
                url: window.location.href
            }).catch(() => {
                this.showMessage('Compartilhamento não disponível neste dispositivo');
            });
        } else {
            this.showMessage('Copiando link para compartilhamento...');
            // Simular cópia do link
            setTimeout(() => {
                this.showMessage('Link copiado! Cole em qualquer lugar para compartilhar 📋');
            }, 1500);
        }
    }

    printStory() {
        // Simular impressão
        this.showMessage('Preparando para impressão... 🖨️');
        
        setTimeout(() => {
            const story = this.currentStory || storyData;
            const printWindow = window.open('', '_blank');
            const printContent = this.generatePrintContent(story);
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
            this.showMessage('História enviada para impressão!');
        }, 1000);
    }

    generateStoryContent(story) {
        const paragraphs = story.paragraphs || storyData.paragraphs;
        const text = paragraphs.map(p => typeof p === 'string' ? p : p.text).join('\n\n');
        return `${story.title}\n\n${text}`;
    }

    generatePrintContent(story) {
        const paragraphs = story.paragraphs || storyData.paragraphs;
        const text = paragraphs.map(p => `<p>${typeof p === 'string' ? p : p.text}</p>`).join('');
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${story.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                    h1 { color: #333; text-align: center; }
                    p { margin-bottom: 15px; }
                </style>
            </head>
            <body>
                <h1>${story.title}</h1>
                ${text}
            </body>
            </html>
        `;
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    getFallbackStory() {
        return {
            id: 'fallback-story',
            title: 'O Dragão Estelar e a Fada Azul',
            paragraphs: storyData.paragraphs,
            metadata: {
                createdAt: new Date().toISOString(),
                generatedBy: 'fallback',
                wordCount: 156
            }
        };
    }

    showMessage(message) {
        // Criar elemento de mensagem
        const messageElement = document.createElement('div');
        messageElement.className = 'message-popup';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-size: 1rem;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
        `;

        document.body.appendChild(messageElement);

        // Remover mensagem após 3 segundos
        setTimeout(() => {
            messageElement.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 3000);
    }
}

// Animações CSS adicionais
const additionalStyles = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new ScreenManager();
    
    // Adicionar efeitos de som (opcional)
    addSoundEffects();
});

// Efeitos de som simples
function addSoundEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Simular som de clique (usando Web Audio API se disponível)
            if (window.AudioContext || window.webkitAudioContext) {
                playClickSound();
            }
        });
    });
}

function playClickSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Silenciosamente ignorar erros de áudio
    }
}

// Adicionar suporte para gestos de toque (swipe)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe para esquerda - próxima tela
            handleSwipeLeft();
        } else {
            // Swipe para direita - tela anterior
            handleSwipeRight();
        }
    }
}

function handleSwipeLeft() {
    const currentScreen = document.querySelector('.screen.active').id;
    
    switch(currentScreen) {
        case 'home-screen':
            document.getElementById('create-story-btn').click();
            break;
        case 'story-screen':
            document.getElementById('save-share-btn').click();
            break;
    }
}

function handleSwipeRight() {
    const currentScreen = document.querySelector('.screen.active').id;
    
    switch(currentScreen) {
        case 'story-screen':
            document.getElementById('back-btn').click();
            break;
        case 'save-share-screen':
            document.getElementById('back-to-story-btn').click();
            break;
        case 'voice-capture-screen':
            document.getElementById('back-from-voice-btn').click();
            break;
        case 'ai-config-screen':
            document.getElementById('back-from-ai-btn').click();
            break;
    }
}

// Adicionar suporte para teclas de navegação
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            handleSwipeRight();
            break;
        case 'ArrowRight':
            handleSwipeLeft();
            break;
        case 'Escape':
            const currentScreen = document.querySelector('.screen.active').id;
            if (currentScreen !== 'home-screen') {
                const backBtn = document.querySelector(`#${currentScreen} .btn[class*="back"]`);
                if (backBtn) backBtn.click();
            }
            break;
    }
}); 