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
        this.isPlaying = false;
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
        // Event listeners para botões do menu principal
        document.getElementById('voiceStoryBtn').addEventListener('click', () => {
            this.showVoiceCaptureScreen();
        });

        document.getElementById('aiStoryBtn').addEventListener('click', () => {
            this.showAICreationScreen();
        });

        document.getElementById('exampleStoryBtn').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Event listeners para botões da tela de história
        document.getElementById('listenBtn').addEventListener('click', () => {
            this.toggleAudio();
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('printBtn').addEventListener('click', () => {
            this.printStory();
        });

        document.getElementById('newStoryBtn').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Event listeners para botões da tela de compartilhamento
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveStory();
        });

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Event listeners para botões da tela de IA
        document.getElementById('generateStoryBtn').addEventListener('click', () => {
            this.generateStory();
        });

        document.getElementById('backFromAIBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    showVoiceCaptureScreen() {
        this.currentScreen = 'voiceCapture';
        this.updateScreen();
        
        // Iniciar narração automática das instruções
        this.speakInstructions();
        
        // Configurar elementos da interface
        this.setupVoiceInterface();
    }

    speakInstructions() {
        const instructionText = document.getElementById('instructionText');
        if (instructionText && 'speechSynthesis' in window) {
            const text = instructionText.innerText;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.8;
            utterance.pitch = 1.2;
            
            // Usar voz feminina se disponível
            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.lang.includes('pt') && voice.name.includes('female')
            );
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            this.currentSpeech = utterance;
            speechSynthesis.speak(utterance);
        }
    }

    toggleAudio() {
        if (this.isPlaying) {
            this.stopAudio();
        } else {
            this.playStoryAudio();
        }
    }

    playStoryAudio() {
        if (!this.currentStory) {
            this.showMessage('Nenhuma história carregada');
            return;
        }

        if ('speechSynthesis' in window) {
            // Parar qualquer áudio anterior
            speechSynthesis.cancel();
            
            const story = this.currentStory;
            const fullText = story.paragraphs.map(p => 
                typeof p === 'string' ? p : p.text
            ).join('. ');
            
            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.8;
            utterance.pitch = 1.1;
            
            // Usar voz feminina se disponível
            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.lang.includes('pt') && voice.name.includes('female')
            );
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            utterance.onstart = () => {
                this.isPlaying = true;
                document.getElementById('listenBtn').innerHTML = '⏸️ Pausar';
            };
            
            utterance.onend = () => {
                this.isPlaying = false;
                document.getElementById('listenBtn').innerHTML = '🔊 Ouvir História';
            };
            
            utterance.onerror = () => {
                this.isPlaying = false;
                document.getElementById('listenBtn').innerHTML = '🔊 Ouvir História';
                this.showMessage('Erro ao reproduzir áudio');
            };
            
            speechSynthesis.speak(utterance);
        } else {
            this.showMessage('Síntese de voz não disponível neste navegador');
        }
    }

    stopAudio() {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        this.isPlaying = false;
        document.getElementById('listenBtn').innerHTML = '🔊 Ouvir História';
    }

    toggleInstructions() {
        const pauseBtn = document.getElementById('pauseBtn');
        if (speechSynthesis.speaking) {
            speechSynthesis.pause();
            pauseBtn.innerHTML = '▶️ Continuar';
        } else {
            speechSynthesis.resume();
            pauseBtn.innerHTML = '⏸️ Pausar';
        }
    }

    setupVoiceInterface() {
        this.capturedText = '';
        this.isRecording = false;
        
        // Atualizar interface inicial
        document.getElementById('voiceStatus').innerHTML = '<p>Aguardando você falar...</p>';
        document.getElementById('capturedText').innerHTML = '<p>Clique em "Começar a Gravar" e conte sua história! 🎤</p>';
        
        // Mostrar apenas o botão de começar
        document.getElementById('startVoiceBtn').style.display = 'inline-block';
        document.getElementById('stopVoiceBtn').style.display = 'none';
        document.getElementById('playThemeBtn').style.display = 'none';
        document.getElementById('createStoryBtn').style.display = 'none';
    }

    startVoiceCapture() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showMessage('Reconhecimento de voz não disponível neste navegador');
            return;
        }

        this.isRecording = true;
        this.capturedText = '';
        
        // Atualizar interface
        document.getElementById('startVoiceBtn').style.display = 'none';
        document.getElementById('stopVoiceBtn').style.display = 'inline-block';
        document.getElementById('voiceStatus').innerHTML = '<p>🎤 Gravando... Fale agora!</p>';
        document.getElementById('micAnimation').classList.add('recording');
        document.getElementById('capturedText').innerHTML = '<p>Ouvindo você...</p>';
        
        // Configurar reconhecimento de voz
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'pt-BR';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        this.recognition.onstart = () => {
            console.log('Reconhecimento de voz iniciado');
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            this.capturedText += finalTranscript;
            
            // Atualizar interface em tempo real
            const displayText = this.capturedText + interimTranscript;
            document.getElementById('capturedText').innerHTML = 
                `<p>${displayText || 'Falando...'}</p>`;
        };
        
        this.recognition.onerror = (event) => {
            console.error('Erro no reconhecimento de voz:', event.error);
            this.stopVoiceCapture();
        };
        
        this.recognition.onend = () => {
            if (this.isRecording) {
                // Reiniciar se ainda estiver gravando
                this.recognition.start();
            }
        };
        
        this.recognition.start();
    }

    stopVoiceCapture() {
        this.isRecording = false;
        
        if (this.recognition) {
            this.recognition.stop();
        }
        
        // Atualizar interface
        document.getElementById('startVoiceBtn').style.display = 'inline-block';
        document.getElementById('stopVoiceBtn').style.display = 'none';
        document.getElementById('micAnimation').classList.remove('recording');
        
        if (this.capturedText.trim()) {
            document.getElementById('voiceStatus').innerHTML = '<p>✅ História capturada!</p>';
            document.getElementById('playThemeBtn').style.display = 'inline-block';
            document.getElementById('createStoryBtn').style.display = 'inline-block';
        } else {
            document.getElementById('voiceStatus').innerHTML = '<p>Não consegui ouvir nada. Tente novamente!</p>';
            document.getElementById('capturedText').innerHTML = '<p>Clique em "Começar a Gravar" e conte sua história! 🎤</p>';
        }
    }

    playCapturedTheme() {
        if (this.capturedText && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(this.capturedText);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.8;
            
            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.lang.includes('pt') && voice.name.includes('female')
            );
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            speechSynthesis.speak(utterance);
        }
    }

    createStoryFromVoice() {
        if (!this.capturedText.trim()) {
            this.showMessage('Primeiro capture sua história com a voz!');
            return;
        }
        
        // Mostrar tela de criação com IA
        this.showAICreationScreen();
        
        // Simular processamento da IA com o texto capturado
        setTimeout(() => {
            this.processVoiceInput(this.capturedText);
        }, 1000);
    }

    processVoiceInput(voiceText) {
        // Mostrar tela de carregamento
        this.showMessage('Criando sua história mágica com IA... ✨');
        
        // Gerar história com IA usando o texto de voz
        this.aiManager.generateStory({ voiceText: voiceText })
            .then(story => {
                this.currentStory = story;
                this.showStoryScreen();
                this.showMessage('História criada com sucesso! 🎉');
            })
            .catch(error => {
                console.error('Erro ao gerar história:', error);
                this.showMessage('Usando história de exemplo... 📖');
                this.currentStory = this.getFallbackStory();
                this.showStoryScreen();
            });
    }

    extractThemes(text) {
        const themeKeywords = {
            'amizade': ['amigo', 'amiga', 'amizade', 'juntos', 'ajudar'],
            'coragem': ['coragem', 'bravo', 'valente', 'medo', 'superar'],
            'aventura': ['aventura', 'explorar', 'descoberta', 'viagem'],
            'magia': ['mágico', 'magia', 'encantado', 'feitiço', 'poder'],
            'natureza': ['floresta', 'árvore', 'animal', 'plantas', 'terra'],
            'espaço': ['estrela', 'lua', 'planeta', 'nave', 'universo']
        };
        
        const foundThemes = [];
        const lowerText = text.toLowerCase();
        
        for (const [theme, keywords] of Object.entries(themeKeywords)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                foundThemes.push(theme);
            }
        }
        
        return foundThemes.length > 0 ? foundThemes : ['aventura'];
    }

    extractCharacters(text) {
        const characterKeywords = [
            'gato', 'cachorro', 'dragão', 'princesa', 'príncipe', 'fada', 'bruxa',
            'gigante', 'anão', 'elfo', 'unicórnio', 'sereia', 'pássaro', 'urso',
            'coelho', 'raposa', 'lobo', 'leão', 'tigre', 'elefante', 'girafa'
        ];
        
        const lowerText = text.toLowerCase();
        const foundCharacters = characterKeywords.filter(char => 
            lowerText.includes(char)
        );
        
        return foundCharacters.length > 0 ? foundCharacters : ['amigo mágico'];
    }

    extractSetting(text) {
        const settingKeywords = {
            'floresta': ['floresta', 'mata', 'árvores', 'bosque'],
            'castelo': ['castelo', 'palácio', 'torre', 'fortaleza'],
            'espaço': ['espaço', 'estrelas', 'lua', 'planeta', 'universo'],
            'oceano': ['mar', 'oceano', 'praia', 'ilha', 'sereia'],
            'montanha': ['montanha', 'montanhas', 'pico', 'rocha'],
            'cidade': ['cidade', 'rua', 'casa', 'prédio']
        };
        
        const lowerText = text.toLowerCase();
        
        for (const [setting, keywords] of Object.entries(settingKeywords)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return setting;
            }
        }
        
        return 'mundo mágico';
    }

    generateStoryFromVoice(themes, characters, setting, originalText) {
        // Criar uma história baseada nos elementos extraídos
        const mainCharacter = characters[0] || 'amigo mágico';
        const mainTheme = themes[0] || 'aventura';
        
        const storyTemplates = {
            'amizade': {
                title: `A Grande Amizade do ${mainCharacter.charAt(0).toUpperCase() + mainCharacter.slice(1)}`,
                paragraphs: [
                    `Era uma vez um ${mainCharacter} que vivia em um ${setting} muito especial.`,
                    `Um dia, ele encontrou um novo amigo que precisava de ajuda.`,
                    `Juntos, eles descobriram que a amizade é a maior magia de todas!`,
                    `E desde então, eles viveram felizes para sempre, sempre ajudando uns aos outros.`
                ]
            },
            'coragem': {
                title: `O ${mainCharacter.charAt(0).toUpperCase() + mainCharacter.slice(1)} Corajoso`,
                paragraphs: [
                    `Havia um ${mainCharacter} que morava em um ${setting} misterioso.`,
                    `Ele sempre teve medo de enfrentar desafios, mas um dia decidiu ser corajoso.`,
                    `Com muito esforço e determinação, ele superou todos os seus medos.`,
                    `Agora ele é conhecido como o ${mainCharacter} mais corajoso de todos!`
                ]
            },
            'aventura': {
                title: `A Aventura Mágica do ${mainCharacter.charAt(0).toUpperCase() + mainCharacter.slice(1)}`,
                paragraphs: [
                    `Em um ${setting} distante, vivia um ${mainCharacter} que sonhava com grandes aventuras.`,
                    `Um dia, ele partiu em uma jornada incrível cheia de surpresas.`,
                    `Pelo caminho, ele fez novos amigos e descobriu lugares mágicos.`,
                    `Quando voltou para casa, ele tinha histórias incríveis para contar!`
                ]
            }
        };
        
        return storyTemplates[mainTheme] || storyTemplates['aventura'];
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
        this.showMessage('Salvando história... 💾');
        
        setTimeout(() => {
            this.showMessage('História salva com sucesso! 📁');
        }, 1500);
    }

    shareStory() {
        // Simular compartilhamento
        if (navigator.share) {
            const story = this.currentStory || storyData;
            const firstParagraph = typeof story.paragraphs[0] === 'string' ? 
                story.paragraphs[0] : story.paragraphs[0].text;
            
            navigator.share({
                title: story.title,
                text: firstParagraph,
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
                    body { 
                        font-family: 'Fredoka', Arial, sans-serif; 
                        line-height: 1.8; 
                        padding: 30px; 
                        max-width: 800px;
                        margin: 0 auto;
                        background: #f9f9f9;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 15px;
                    }
                    h1 { 
                        color: #333; 
                        text-align: center; 
                        font-size: 2.5rem;
                        margin-bottom: 10px;
                    }
                    .subtitle {
                        font-size: 1.2rem;
                        opacity: 0.9;
                    }
                    p { 
                        margin-bottom: 20px; 
                        font-size: 1.3rem;
                        text-align: justify;
                        color: #333;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding: 20px;
                        border-top: 2px solid #eee;
                        color: #666;
                    }
                    @media print {
                        body { background: white; }
                        .header { background: #667eea !important; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${story.title}</h1>
                    <div class="subtitle">Uma história mágica do Criamundo</div>
                </div>
                ${text}
                <div class="footer">
                    <p>✨ Criado com amor pelo Criamundo ✨</p>
                    <p>Para crianças de 4 a 9 anos</p>
                </div>
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

    showShareScreen() {
        this.currentScreen = 'share';
        this.updateScreen();
        
        // Adicionar funcionalidade ao botão "Criar Nova História"
        setTimeout(() => {
            const newStoryBtn = document.getElementById('newStoryBtn');
            if (newStoryBtn) {
                newStoryBtn.addEventListener('click', () => {
                    this.showMainMenu();
                });
            }
        }, 100);
    }

    updateScreen() {
        // Esconder todas as telas
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.style.display = 'none');
        
        // Mostrar a tela atual
        const currentScreenElement = document.getElementById(this.getScreenId());
        if (currentScreenElement) {
            currentScreenElement.style.display = 'block';
        }
    }

    getScreenId() {
        const screenMap = {
            'main': 'mainMenuScreen',
            'story': 'storyScreen',
            'share': 'shareScreen',
            'ai': 'aiCreationScreen',
            'voiceCapture': 'voiceCaptureScreen'
        };
        return screenMap[this.currentScreen] || 'mainMenuScreen';
    }

    showMainMenu() {
        this.currentScreen = 'main';
        this.updateScreen();
    }

    showStoryScreen() {
        this.currentScreen = 'story';
        this.updateScreen();
        this.loadStory();
    }

    showAICreationScreen() {
        this.currentScreen = 'ai';
        this.updateScreen();
    }

    generateStory() {
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

        this.showMessage('Criando história mágica com IA... ✨');
        
        // Gerar história com IA
        this.aiManager.generateStory(params)
            .then(story => {
                this.currentStory = story;
                this.showStoryScreen();
                this.showMessage('História criada com sucesso! 🎉');
            })
            .catch(error => {
                console.error('Erro ao gerar história:', error);
                this.showMessage('Usando história de exemplo... 📖');
                this.currentStory = this.getFallbackStory();
                this.showStoryScreen();
            });
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