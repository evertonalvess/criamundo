/**
 * AI Manager - Gerenciador de Integração com IA
 * Responsável por gerar histórias, imagens e áudio usando IA
 */

class AIManager {
    constructor() {
        this.config = null;
        this.isInitialized = false;
        this.currentStory = null;
        this.apiKey = null;
        this.init();
    }

    async init() {
        try {
            console.log('🔧 AI Manager - Iniciando...');
            const response = await fetch('/config/ai-config.json');
            this.config = await response.json();
            console.log('📋 Configuração carregada:', this.config);
            
            // Verificar se a API key está configurada
            this.apiKey = this.config.openai.apiKey;
            console.log('🔑 API Key encontrada:', this.apiKey ? 'Sim' : 'Não');
            
            if (this.apiKey && this.apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
                this.isInitialized = true;
                console.log('✅ AI Manager inicializado com OpenAI');
            } else {
                console.log('⚠️ OpenAI não configurado - usando modo fallback');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configuração da IA:', error);
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
        console.log('🔍 AI Manager - generateStory chamado com params:', params);
        
        if (!this.isInitialized) {
            console.log('⚠️ AI Manager não inicializado - usando fallback');
            return this.getFallbackStory(params);
        }

        try {
            console.log('🚀 Chamando OpenAI API...');
            const prompt = this.buildPrompt(params);
            console.log('📝 Prompt gerado:', prompt);
            
            const story = await this.callOpenAI(prompt);
            console.log('✅ Resposta da OpenAI:', story);
            
            const parsedStory = this.parseStoryResponse(story);
            console.log('📖 História processada:', parsedStory);
            
            return parsedStory;
        } catch (error) {
            console.error('❌ Erro ao gerar história com OpenAI:', error);
            return this.getFallbackStory(params);
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
    async callOpenAI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: this.config.openai.systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.config.openai.maxTokens,
                temperature: this.config.openai.temperature
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
    buildPrompt(params) {
        let prompt = this.config.openai.systemPrompt + '\n\n';
        
        if (params.tema) {
            prompt += `Tema principal: ${params.tema}\n`;
        }
        if (params.personagens) {
            prompt += `Personagens: ${params.personagens}\n`;
        }
        if (params.cenario) {
            prompt += `Cenário: ${params.cenario}\n`;
        }
        if (params.voiceText) {
            prompt += `Inspiração da criança: "${params.voiceText}"\n`;
        }

        prompt += '\nCrie uma história mágica e envolvente baseada nos elementos acima.';
        
        return prompt;
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
    getFallbackStory(params = {}) {
        const fallbackStories = this.config.fallback.stories;
        const randomStory = fallbackStories[Math.floor(Math.random() * fallbackStories.length)];
        
        // Personalizar história de fallback se houver parâmetros
        if (params.tema || params.personagens || params.cenario) {
            return this.personalizeFallbackStory(randomStory, params);
        }
        
        return randomStory;
    }

    personalizeFallbackStory(story, params) {
        let personalizedStory = { ...story };
        
        if (params.tema) {
            personalizedStory.title = `${personalizedStory.title} - ${params.tema}`;
        }
        
        if (params.personagens) {
            // Substituir personagens na história
            personalizedStory.paragraphs = personalizedStory.paragraphs.map(paragraph => {
                return paragraph.replace(/dragão/g, params.personagens)
                              .replace(/fada/g, params.personagens);
            });
        }
        
        return personalizedStory;
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
        return this.isInitialized;
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

    parseStoryResponse(response) {
        try {
            // Tentar extrair título e parágrafos da resposta
            const lines = response.split('\n').filter(line => line.trim());
            
            let title = 'História Mágica';
            let paragraphs = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Procurar por título (primeira linha ou linha que começa com #)
                if (i === 0 || line.startsWith('#') || line.startsWith('Título:')) {
                    title = line.replace(/^[#\s]*Título:\s*/, '').replace(/^[#\s]+/, '');
                    continue;
                }
                
                // Ignorar linhas vazias ou marcadores
                if (line === '' || line.startsWith('-') || line.startsWith('*')) {
                    continue;
                }
                
                // Adicionar como parágrafo se não for muito curto
                if (line.length > 10) {
                    paragraphs.push(line);
                }
            }
            
            // Se não encontrou parágrafos, dividir por pontos
            if (paragraphs.length === 0) {
                paragraphs = response.split('.').filter(p => p.trim().length > 10);
            }
            
            // Limitar a 4 parágrafos
            paragraphs = paragraphs.slice(0, 4);
            
            return {
                title: title,
                paragraphs: paragraphs
            };
        } catch (error) {
            console.error('Erro ao processar resposta da IA:', error);
            return this.getFallbackStory();
        }
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            hasApiKey: !!this.apiKey && this.apiKey !== 'YOUR_OPENAI_API_KEY_HERE',
            config: this.config ? 'loaded' : 'not_loaded'
        };
    }
}

// Exportar para uso global
window.AIManager = AIManager; 