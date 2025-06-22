/**
 * Gerenciador de Telas - Carrega componentes dinamicamente
 */
class ScreenManager {
    constructor() {
        this.screens = {};
        this.loadedScreens = new Set();
    }

    /**
     * Carrega uma tela específica
     */
    async loadScreen(screenName) {
        if (this.loadedScreens.has(screenName)) {
            return this.screens[screenName];
        }

        try {
            const response = await fetch(`components/${screenName}.html`);
            if (!response.ok) {
                throw new Error(`Erro ao carregar tela: ${response.status}`);
            }

            const html = await response.text();
            this.screens[screenName] = html;
            this.loadedScreens.add(screenName);
            
            console.log(`Tela ${screenName} carregada com sucesso`);
            return html;
        } catch (error) {
            console.error(`Erro ao carregar tela ${screenName}:`, error);
            return null;
        }
    }

    /**
     * Carrega todas as telas necessárias
     */
    async loadAllScreens() {
        const screenNames = [
            'welcome-screen',
            'audio-permission-modal',
            'loading-screen',
            'story-screen'
        ];

        const loadPromises = screenNames.map(name => this.loadScreen(name));
        await Promise.all(loadPromises);
        
        console.log('Todas as telas carregadas');
    }

    /**
     * Insere uma tela no DOM
     */
    insertScreen(screenName, containerId = 'app-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} não encontrado`);
            return false;
        }

        const screenHtml = this.screens[screenName];
        if (!screenHtml) {
            console.error(`Tela ${screenName} não carregada`);
            return false;
        }

        // Verificar se a tela já existe
        const existingScreen = document.getElementById(screenName.replace('-', '-'));
        if (existingScreen) {
            console.log(`Tela ${screenName} já existe no DOM`);
            return true;
        }

        // Inserir a tela
        container.insertAdjacentHTML('beforeend', screenHtml);
        console.log(`Tela ${screenName} inserida no DOM`);
        return true;
    }

    /**
     * Mostra uma tela específica
     */
    showScreen(screenId) {
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Mostrar tela solicitada
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log(`Tela ${screenId} ativada`);
        } else {
            console.error(`Tela ${screenId} não encontrada`);
        }
    }

    /**
     * Inicializa o sistema de telas
     */
    async init() {
        console.log('Inicializando gerenciador de telas...');
        await this.loadAllScreens();
        
        // Inserir telas no DOM
        this.insertScreen('welcome-screen');
        this.insertScreen('audio-permission-modal');
        this.insertScreen('loading-screen');
        this.insertScreen('story-screen');
        
        console.log('Sistema de telas inicializado');
    }
}

// Exportar para uso global
window.ScreenManager = ScreenManager; 