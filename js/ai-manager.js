/**
 * AI Manager - Gerenciador de Integração com IA
 * Responsável por gerar histórias, imagens e áudio usando IA
 */

class AIManager {
    constructor() {
        this.config = null;
        this.isInitialized = false;
        this.currentStory = null;
        this.init();
    }

    async init() {
        try {
            // Carregar configuração
            const response = await fetch('config/ai-config.json');
            this.config = await response.json();
            this.isInitialized = true;
            console.log('AI Manager inicializado com sucesso');
        } catch (error) {
            console.warn('Erro ao carregar configuração de IA:', error);
            this.config = this.getDefaultConfig();
            this.isInitialized = true;
        }
    }

    getDefaultConfig() {
        return {
            ai: { enabled: false },
            features: {
                voiceRecognition: { enabled: false },
                textToSpeech: { enabled: false },
                imageGeneration: { enabled: false }
            },
            fallback: { enableOfflineMode: true }
        };
    }

    /**
     * Gera uma história usando IA
     * @param {Object} params - Parâmetros para geração
     * @returns {Promise<Object>} História gerada
     */
    async generateStory(params = {}) {
        if (!this.isInitialized) {
            await this.init();
        }

        // Se IA não estiver habilitada, usar história de fallback
        if (!this.config.ai.enabled) {
            return this.getFallbackStory();
        }

        try {
            const storyParams = {
                tema: params.tema || this.getRandomTheme(),
                personagens: params.personagens || this.getRandomCharacters(),
                ...params
            };

            const story = await this.callAIProvider('storyGeneration', storyParams);
            return this.formatStory(story);
        } catch (error) {
            console.error('Erro ao gerar história com IA:', error);
            return this.getFallbackStory();
        }
    }

    /**
     * Gera imagem para a história
     * @param {string} storyTitle - Título da história
     * @param {string} scene - Cena para ilustrar
     * @returns {Promise<string>} URL da imagem gerada
     */
    async generateImage(storyTitle, scene) {
        if (!this.config.features.imageGeneration.enabled) {
            return this.getFallbackImage(storyTitle);
        }

        try {
            const imageParams = {
                titulo: storyTitle,
                cena: scene
            };

            const imageUrl = await this.callAIProvider('imageGeneration', imageParams);
            return imageUrl;
        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            return this.getFallbackImage(storyTitle);
        }
    }

    /**
     * Gera áudio para a história
     * @param {string} storyTitle - Título da história
     * @param {string} storyText - Texto da história
     * @returns {Promise<Blob>} Áudio gerado
     */
    async generateAudio(storyTitle, storyText) {
        if (!this.config.features.textToSpeech.enabled) {
            return this.getFallbackAudio();
        }

        try {
            const audioParams = {
                titulo: storyTitle,
                texto: storyText
            };

            const audioBlob = await this.callAIProvider('audioGeneration', audioParams);
            return audioBlob;
        } catch (error) {
            console.error('Erro ao gerar áudio:', error);
            return this.getFallbackAudio();
        }
    }

    /**
     * Chama o provedor de IA configurado
     * @param {string} task - Tipo de tarefa
     * @param {Object} params - Parâmetros
     * @returns {Promise<any>} Resultado da IA
     */
    async callAIProvider(task, params) {
        const providers = this.config.ai.providers;
        
        // Verificar qual provedor está habilitado
        for (const [providerName, provider] of Object.entries(providers)) {
            if (provider.enabled) {
                return await this.callProvider(providerName, task, params);
            }
        }

        throw new Error('Nenhum provedor de IA habilitado');
    }

    /**
     * Chama um provedor específico
     * @param {string} providerName - Nome do provedor
     * @param {string} task - Tipo de tarefa
     * @param {Object} params - Parâmetros
     * @returns {Promise<any>} Resultado
     */
    async callProvider(providerName, task, params) {
        switch (providerName) {
            case 'openai':
                return await this.callOpenAI(task, params);
            case 'anthropic':
                return await this.callAnthropic(task, params);
            case 'local':
                return await this.callLocal(task, params);
            default:
                throw new Error(`Provedor ${providerName} não suportado`);
        }
    }

    /**
     * Chama OpenAI API
     */
    async callOpenAI(task, params) {
        const provider = this.config.ai.providers.openai;
        const prompt = this.buildPrompt(task, params);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    { role: 'system', content: this.config.ai.prompts[task].system },
                    { role: 'user', content: prompt }
                ],
                max_tokens: provider.maxTokens,
                temperature: provider.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Chama Anthropic API
     */
    async callAnthropic(task, params) {
        const provider = this.config.ai.providers.anthropic;
        const prompt = this.buildPrompt(task, params);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': provider.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: provider.model,
                max_tokens: provider.maxTokens,
                messages: [
                    { role: 'user', content: prompt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    /**
     * Chama API local
     */
    async callLocal(task, params) {
        const provider = this.config.ai.providers.local;
        const prompt = this.buildPrompt(task, params);

        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: provider.model,
                prompt: prompt,
                task: task
            })
        });

        if (!response.ok) {
            throw new Error(`Local API error: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
    }

    /**
     * Constrói o prompt para a tarefa
     */
    buildPrompt(task, params) {
        const promptTemplate = this.config.ai.prompts[task].user;
        return promptTemplate.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] || match;
        });
    }

    /**
     * Formata a história gerada
     */
    formatStory(rawStory) {
        // Dividir em parágrafos
        const paragraphs = rawStory.split('\n\n').filter(p => p.trim());
        
        return {
            id: this.generateStoryId(),
            title: this.extractTitle(paragraphs[0]),
            paragraphs: paragraphs.map((p, index) => ({
                id: index + 1,
                text: p.trim(),
                illustration: `scene-${index + 1}`,
                audioDuration: Math.ceil(p.split(' ').length / 3) // Estimativa de duração
            })),
            metadata: {
                createdAt: new Date().toISOString(),
                generatedBy: 'ai',
                wordCount: rawStory.split(' ').length
            }
        };
    }

    /**
     * Gera ID único para história
     */
    generateStoryId() {
        return 'story-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Extrai título da primeira linha
     */
    extractTitle(firstParagraph) {
        // Remove marcadores como "Título:" ou "#"
        return firstParagraph.replace(/^(Título|Title|#)\s*:?\s*/i, '').trim();
    }

    /**
     * Retorna tema aleatório
     */
    getRandomTheme() {
        const themes = this.config.ai.storyStructure.themes;
        return themes[Math.floor(Math.random() * themes.length)];
    }

    /**
     * Retorna personagens aleatórios
     */
    getRandomCharacters() {
        const characterTypes = this.config.ai.storyStructure.characterTypes;
        const type = characterTypes[Math.floor(Math.random() * characterTypes.length)];
        
        const characterExamples = {
            'animais': ['um gato e um cachorro', 'uma coruja e um esquilo', 'um leão e um rato'],
            'criaturas mágicas': ['um dragão e uma fada', 'um unicórnio e um gnomo', 'uma sereia e um tritão'],
            'crianças': ['duas crianças amigas', 'um menino e uma menina', 'três amigos'],
            'super-heróis': ['um super-herói e seu ajudante', 'duas heroínas', 'um herói e uma vilã redimida'],
            'princesas e príncipes': ['uma princesa e um príncipe', 'duas princesas', 'um príncipe e seu cavalo'],
            'profissionais': ['um médico e um professor', 'um bombeiro e um policial', 'um astronauta e um cientista']
        };

        return characterExamples[type] ? 
            characterExamples[type][Math.floor(Math.random() * characterExamples[type].length)] :
            'personagens mágicos';
    }

    /**
     * Retorna história de fallback
     */
    getFallbackStory() {
        return {
            id: 'fallback-story',
            title: 'O Dragão Estelar e a Fada Azul',
            paragraphs: [
                {
                    id: 1,
                    text: "Era uma vez um dragão brilhante chamado Draco, que morava numa estrela cadente no céu. Seu lar era feito de poeira cósmica e luz colorida, e ele adorava voar entre os planetas brincando de esconde-esconde com os cometas.",
                    illustration: 'dragao-estrela',
                    audioDuration: 15
                },
                {
                    id: 2,
                    text: "Um dia, enquanto voava perto de Saturno, Draco encontrou uma fada azul chamada Luma. Ela carregava uma varinha feita de gelo lunar e tinha asas que brilhavam como diamantes. Luma estava procurando um lugar para plantar estrelas novas.",
                    illustration: 'fada-saturno',
                    audioDuration: 18
                },
                {
                    id: 3,
                    text: "Draco e Luma se tornaram grandes amigos. Juntos, eles criaram constelações no céu noturno desenhando com poeira de estrelas. Cada desenho virava uma história para as crianças da Terra.",
                    illustration: 'constelacoes',
                    audioDuration: 16
                }
            ],
            metadata: {
                createdAt: new Date().toISOString(),
                generatedBy: 'fallback',
                wordCount: 89
            }
        };
    }

    /**
     * Retorna imagem de fallback
     */
    getFallbackImage(storyTitle) {
        // Retorna uma ilustração baseada em emojis
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="300" fill="#f0f8ff"/>
                <text x="200" y="150" font-family="Arial" font-size="48" text-anchor="middle" fill="#333">
                    🎨
                </text>
                <text x="200" y="200" font-family="Arial" font-size="16" text-anchor="middle" fill="#666">
                    ${storyTitle}
                </text>
            </svg>
        `)}`;
    }

    /**
     * Retorna áudio de fallback
     */
    getFallbackAudio() {
        // Retorna um áudio silencioso de 1 segundo
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
        
        return new Blob([], { type: 'audio/wav' });
    }

    /**
     * Verifica se a IA está disponível
     */
    isAvailable() {
        return this.isInitialized && this.config.ai.enabled;
    }

    /**
     * Obtém mensagens de carregamento
     */
    getLoadingMessages() {
        return this.config.ui.loadingMessages || [
            'Pensando em uma história mágica...',
            'Criando personagens especiais...',
            'Finalizando sua história...'
        ];
    }

    /**
     * Obtém mensagem de erro
     */
    getErrorMessage(type = 'general') {
        const messages = this.config.ui.errorMessages;
        return messages[type] || messages.general || 'Algo deu errado. Tente novamente!';
    }
}

// Exportar para uso global
window.AIManager = AIManager; 