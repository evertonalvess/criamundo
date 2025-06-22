/**
 * AI Manager - Gerenciador de Integração com IA
 * Responsável por gerar histórias, imagens e áudio usando IA
 */

class AIManager {
    constructor() {
        this.config = null;
        this.apiKey = null;
        this.isInitialized = false;
        this.isInitializing = false; // Flag para evitar inicialização duplicada
        this.currentStory = null;
        this.init();
    }

    async init() {
        // Evitar inicialização duplicada
        if (this.isInitialized || this.isInitializing) {
            return;
        }
        
        this.isInitializing = true;
        console.log('AI Manager - Iniciando...');
        
        try {
            // Carregar configuração
            const response = await fetch('config/ai-config.json');
            this.config = await response.json();
            console.log('Configuração carregada:', this.config);

            // Obter API Key de forma segura
            this.apiKey = await this.getSecureAPIKey();
            
            if (this.apiKey && this.apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
                console.log('API Key encontrada: Sim');
                console.log('API Key é válida: true');
                console.log('AI Manager inicializado com OpenAI');
                this.isInitialized = true;
            } else {
                console.log('API Key não configurada, usando modo fallback');
                this.isInitialized = false;
            }
        } catch (error) {
            console.error('Erro ao inicializar AI Manager:', error);
            this.isInitialized = false;
        } finally {
            this.isInitializing = false;
        }
    }

    async getSecureAPIKey() {
        // Prioridade 1: Variável de ambiente (mais seguro)
        if (typeof process !== 'undefined' && process.env && process.env.OPENAI_API_KEY) {
            return process.env.OPENAI_API_KEY;
        }

        // Prioridade 2: Configuração local (para desenvolvimento)
        if (this.config && this.config.openai && this.config.openai.apiKey) {
            const apiKey = this.config.openai.apiKey;
            
            // Validação básica de segurança
            if (this.isValidAPIKey(apiKey)) {
                return apiKey;
            }
        }

        // Prioridade 3: Prompt do usuário (fallback)
        return await this.promptForAPIKey();
    }

    isValidAPIKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }

        // Verificar se não é o placeholder
        if (apiKey === 'YOUR_OPENAI_API_KEY_HERE' || apiKey.includes('YOUR_')) {
            return false;
        }

        // Verificar formato básico da OpenAI
        if (!apiKey.startsWith('sk-')) {
            return false;
        }

        // Verificar comprimento mínimo
        if (apiKey.length < 20) {
            return false;
        }

        return true;
    }

    async promptForAPIKey() {
        // Em um ambiente de produção, isso deveria ser feito no backend
        // Por enquanto, retornamos null para usar o modo fallback
        console.log('API Key não encontrada, usando modo fallback');
        return null;
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
        if (!this.isInitialized || !this.apiKey) {
            console.log('Usando modo fallback - gerando história local');
            return this.generateFallbackStory(params);
        }

        try {
            console.log('Gerando história com OpenAI...');
            const story = await this.callOpenAI(params);
            return story;
        } catch (error) {
            console.error('Erro na geração com OpenAI:', error);
            console.log('Fallback para geração local');
            return this.generateFallbackStory(params);
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
    async callOpenAI(params) {
        const { voiceText = '' } = params;
        
        // Extrair palavras-chave do texto de voz
        const keywords = this.extractKeywords(voiceText);
        
        const prompt = this.buildPrompt(keywords);

        const timeout = 20000; // 20 segundos
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'Você é um contador de histórias mágicas para crianças. Crie histórias divertidas, educativas e apropriadas para a idade.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                }),
                signal: controller.signal
            });

            clearTimeout(id);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const message = errorData?.error?.message || `HTTP error! status: ${response.status}`;
                throw new Error(`Erro na API OpenAI: ${message}`);
            }

            const data = await response.json();
            return this.parseStoryResponse(data);

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('A requisição para a IA demorou muito e foi cancelada.');
            }
            // Re-lança outros erros para serem tratados pelo chamador
            throw error;
        }
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
    buildPrompt(keywords) {
        const keywordText = keywords.join(', ');
        return `Crie uma história mágica para crianças com os seguintes elementos: ${keywordText}. 
        
        A história deve ter:
        - Um título criativo
        - 4-6 parágrafos curtos
        - Personagens carismáticos
        - Uma mensagem positiva
        - Linguagem simples e divertida
        
        Formato de resposta:
        TÍTULO: [título da história]
        
        [parágrafo 1]
        
        [parágrafo 2]
        
        [parágrafo 3]
        
        [parágrafo 4]`;
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
        console.log('Gerando história de fallback com parâmetros:', params);
        
        // Se temos parâmetros específicos, criar uma história personalizada
        if (params.voiceText || params.tema || params.personagens || params.cenario) {
            return this.generateCustomFallbackStory(params);
        }
        
        // Caso contrário, usar histórias pré-definidas
        const fallbackStories = this.config.fallback.stories;
        const randomStory = fallbackStories[Math.floor(Math.random() * fallbackStories.length)];
        
        return randomStory;
    }

    generateCustomFallbackStory(params) {
        console.log('Criando história personalizada de fallback');
        
        let title = 'História Mágica';
        let paragraphs = [];
        
        // Extrair elementos dos parâmetros
        const voiceText = params.voiceText || '';
        const tema = params.tema || 'aventura';
        const personagens = params.personagens || 'amigos mágicos';
        const cenario = params.cenario || 'mundo mágico';
        
        // Criar título baseado nos elementos
        if (voiceText) {
            const words = voiceText.split(' ').filter(word => word.length > 2);
            if (words.length > 0) {
                title = `A Aventura dos ${words[0].charAt(0).toUpperCase() + words[0].slice(1)}`;
            }
        } else if (personagens) {
            title = `O ${personagens.charAt(0).toUpperCase() + personagens.slice(1)} Mágico`;
        }
        
        // Gerar parágrafos baseados nos elementos
        const storyTemplates = {
            'amizade': [
                `Era uma vez ${personagens} que viviam em um ${cenario} muito especial. Eles eram os melhores amigos do mundo.`,
                `Um dia, eles descobriram que a verdadeira magia não estava nos poderes, mas na amizade que compartilhavam.`,
                `Juntos, eles enfrentaram todos os desafios e aprenderam que amigos de verdade sempre se ajudam.`,
                `Agora, eles vivem felizes para sempre, espalhando magia e amizade por todo o ${cenario}.`
            ],
            'coragem': [
                `Havia ${personagens} que moravam em um ${cenario} misterioso. Eles sempre tiveram medo de aventuras.`,
                `Mas um dia, eles decidiram ser corajosos e sair em busca de uma grande descoberta.`,
                `Com muito esforço e determinação, eles superaram todos os seus medos e desafios.`,
                `Agora eles são conhecidos como os ${personagens} mais corajosos de todo o ${cenario}!`
            ],
            'aventura': [
                `Em um ${cenario} distante, viviam ${personagens} que sonhavam com grandes aventuras.`,
                `Um dia, eles partiram em uma jornada incrível cheia de surpresas e descobertas mágicas.`,
                `Pelo caminho, eles encontraram novos amigos e descobriram lugares nunca vistos antes.`,
                `Quando voltaram para casa, eles tinham histórias incríveis para contar e memórias para sempre!`
            ],
            'magia': [
                `${personagens} viviam em um ${cenario} onde a magia era real e acontecia todos os dias.`,
                `Eles descobriram que cada um tinha um poder especial e único dentro de si.`,
                `Juntos, eles aprenderam a usar seus poderes para ajudar outros e fazer o bem.`,
                `Agora, eles são os guardiões da magia no ${cenario}, protegendo todos os sonhos e esperanças.`
            ]
        };
        
        // Escolher template baseado no tema ou criar um personalizado
        let template = storyTemplates[tema] || storyTemplates['aventura'];
        
        // Personalizar com o texto de voz se disponível
        if (voiceText) {
            const words = voiceText.toLowerCase().split(' ');
            const keyWords = words.filter(word => word.length > 3);
            
            if (keyWords.length > 0) {
                template = [
                    `Era uma vez ${personagens} que viviam em um ${cenario} muito especial. Eles adoravam ${keyWords[0]}.`,
                    `Um dia, eles decidiram fazer uma grande aventura envolvendo ${keyWords.slice(0, 2).join(' e ')}.`,
                    `Pelo caminho, eles descobriram que a magia está em todas as coisas simples e bonitas.`,
                    `Agora, eles são os melhores amigos e sempre se divertem juntos no ${cenario}.`
                ];
            }
        }
        
        return {
            title: title,
            paragraphs: template,
            metadata: {
                createdAt: new Date().toISOString(),
                generatedBy: 'fallback',
                wordCount: template.join(' ').split(' ').length
            }
        };
    }

    /**
     * Retorna imagem de fallback
     */
    getFallbackImage(storyTitle) {
        // Lista de imagens disponíveis na pasta /img/
        const availableImages = [
            'img/Menino1.png',
            'img/Menino2.png',
            'img/Menina2.png'
        ];
        
        // Escolhe uma imagem aleatoriamente
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const selectedImage = availableImages[randomIndex];
        
        this.log(`Imagem de fallback selecionada: ${selectedImage}`);
        
        return selectedImage;
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
        console.log('Parsing OpenAI response:', response);
        // Validação da resposta da API
        if (!response || !response.choices || response.choices.length === 0 || !response.choices[0].message || !response.choices[0].message.content) {
            console.error('Resposta da API da OpenAI em formato inválido ou sem conteúdo.');
            return null; // Retorna null para indicar falha no parsing
        }

        const storyText = response.choices[0].message.content;
        const lines = storyText.split('\\n').filter(line => line.trim() !== '');
        
        const titleLine = lines.find(line => line.toUpperCase().startsWith('TÍTULO:'));
        const title = titleLine ? titleLine.replace(/TÍTULO:/i, '').trim() : 'História Mágica';
        
        const paragraphs = lines.filter(line => !line.toUpperCase().startsWith('TÍTULO:'));

        if (paragraphs.length === 0) {
            console.error('Não foi possível extrair parágrafos da resposta da IA.');
            return null;
        }
        
        return {
            title: title,
            story: paragraphs.join('\\n\\n'),
            paragraphs: paragraphs.map(p => ({ text: p.trim() }))
        };
    }

    extractKeywords(text) {
        const lowerText = text.toLowerCase();
        const keywords = [];
        
        // Temas
        const themes = ['amizade', 'coragem', 'aventura', 'magia', 'família', 'escola', 'animais', 'natureza'];
        themes.forEach(theme => {
            if (lowerText.includes(theme)) keywords.push(theme);
        });
        
        // Personagens
        const characters = ['gato', 'cachorro', 'dragão', 'fada', 'princesa', 'príncipe', 'unicórnio', 'coruja'];
        characters.forEach(char => {
            if (lowerText.includes(char)) keywords.push(char);
        });
        
        // Cenários
        const settings = ['floresta', 'castelo', 'espaço', 'oceano', 'montanha', 'cidade', 'escola'];
        settings.forEach(setting => {
            if (lowerText.includes(setting)) keywords.push(setting);
        });
        
        return keywords.length > 0 ? keywords : ['aventura', 'amizade'];
    }

    async generateFallbackStory(params = {}) {
        const { voiceText = '' } = params;
        const keywords = this.extractKeywords(voiceText);
        
        // Histórias de fallback baseadas em palavras-chave
        const fallbackStories = {
            'amizade': {
                title: 'A Amizade Mágica',
                paragraphs: [
                    { text: 'Era uma vez um pequeno gato chamado Miau que vivia sozinho em uma casa na floresta.' },
                    { text: 'Um dia, ele encontrou uma fada perdida chamada Luma, que tinha perdido suas asas mágicas.' },
                    { text: 'Miau ajudou Luma a procurar pelas asas, e juntos descobriram que a verdadeira magia estava na amizade.' },
                    { text: 'Desde então, Miau e Luma se tornaram os melhores amigos e viveram muitas aventuras juntos.' }
                ]
            },
            'coragem': {
                title: 'O Dragão Corajoso',
                paragraphs: [
                    { text: 'Em um castelo nas nuvens, vivia um pequeno dragão chamado Draco que tinha medo de voar.' },
                    { text: 'Todos os outros dragões riam dele, mas Draco não desistiu de tentar.' },
                    { text: 'Um dia, uma tempestade ameaçou o castelo, e Draco foi o único que conseguiu voar para salvar todos.' },
                    { text: 'Agora Draco é conhecido como o dragão mais corajoso de todos!' }
                ]
            },
            'aventura': {
                title: 'A Aventura no Espaço',
                paragraphs: [
                    { text: 'Uma pequena nave espacial chamada Estrelinha estava explorando o universo quando encontrou um planeta mágico.' },
                    { text: 'No planeta, ela conheceu seres de luz que dançavam entre as estrelas.' },
                    { text: 'Juntos, eles descobriram que cada planeta tem sua própria música especial.' },
                    { text: 'Estrelinha voltou para casa com muitas histórias para contar sobre sua grande aventura.' }
                ]
            }
        };
        
        // Escolher história baseada nas palavras-chave
        let selectedStory = fallbackStories.aventura; // padrão
        
        for (const keyword of keywords) {
            if (fallbackStories[keyword]) {
                selectedStory = fallbackStories[keyword];
                break;
            }
        }
        
        // Adiciona a propriedade 'story' para padronizar o objeto
        selectedStory.story = selectedStory.paragraphs.map(p => p.text).join('\\n\\n');

        // Adiciona a imagem de fallback ao objeto da história
        selectedStory.image = this.getFallbackImage(selectedStory.title);

        // Adiciona uma flag para identificar que é uma história de fallback
        selectedStory.isFallback = true;

        return selectedStory;
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