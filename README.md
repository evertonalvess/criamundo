# 🌟 Criamundo - Protótipo Web

Um protótipo web responsivo e interativo do app **Criamundo**, focado em crianças de 4 a 9 anos. Este projeto demonstra a experiência de criação e leitura de histórias mágicas.

## 🎯 Sobre o Projeto

O **Criamundo** é uma plataforma que permite às crianças criarem histórias através de sua voz, transformando suas ideias em narrativas mágicas com ilustrações e áudio.

### ✨ Características

- **Design Lúdico**: Interface colorida e amigável para crianças
- **Totalmente Responsivo**: Funciona em smartphone, tablet e desktop
- **Acessível**: Suporte para navegação por teclado e leitores de tela
- **Interativo**: Animações suaves e feedback visual
- **História de Exemplo**: "O Dragão Estelar e a Fada Azul" incluída

## 🚀 Como Executar Localmente

### Pré-requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, mas recomendado)

### Opção 1: Servidor Local Simples

```bash
# Usando Python 3
python -m http.server 8000

# Usando Python 2
python -m SimpleHTTPServer 8000

# Usando Node.js (se tiver instalado)
npx serve .
```

Depois acesse: `http://localhost:8000`

### Opção 2: Abrir Diretamente

Simplesmente abra o arquivo `index.html` no seu navegador.

### Opção 3: Live Server (VS Code)

Se você usa o VS Code, instale a extensão "Live Server" e clique com o botão direito no `index.html` → "Open with Live Server".

## 📱 Como Usar

### Navegação

1. **Tela Inicial**: Clique em "Criar História" para começar
2. **Tela de Carregamento**: Aguarde a simulação do processamento
3. **Tela de História**: Leia a história e use os controles
4. **Tela de Salvar/Compartilhar**: Salve ou compartilhe sua história

### Controles

- **Mouse/Touch**: Clique nos botões
- **Teclado**: Use as setas ← → para navegar, ESC para voltar
- **Swipe**: Em dispositivos móveis, deslize para navegar

### Funcionalidades

- 🎤 **Criar História**: Simula o processo de criação
- 🔊 **Ouvir História**: Simula reprodução de áudio
- 💾 **Salvar**: Baixa a história em formato texto
- 📱 **Compartilhar**: Simula compartilhamento
- 🖨️ **Imprimir**: Abre a história para impressão

## 🏗️ Estrutura do Projeto

```
criamundo/
├── index.html              # Página principal
├── style.css               # Estilos e animações
├── script.js               # Lógica e interações
├── assets/
│   ├── icons/              # Ícones (futuro)
│   └── story-images/       # Imagens das histórias (futuro)
├── stories/
│   └── historia-exemplo.json # História de exemplo estruturada
├── .github/
│   └── workflows/
│       └── deploy.yml      # Configuração do GitHub Pages
└── README.md               # Este arquivo
```

## 🎨 Design e UX

### Cores e Tipografia

- **Fonte**: Fredoka (Google Fonts) - amigável para crianças
- **Cores**: Gradientes suaves em tons de azul e roxo
- **Botões**: Grandes e coloridos com animações

### Responsividade

- **Mobile**: Otimizado para telas pequenas
- **Tablet**: Layout adaptativo
- **Desktop**: Experiência completa

### Acessibilidade

- ✅ Alto contraste
- ✅ Texto grande
- ✅ Navegação por teclado
- ✅ Suporte para leitores de tela
- ✅ Animações opcionais

## 🔧 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos, animações e responsividade
- **JavaScript ES6+**: Interatividade e navegação
- **Web Audio API**: Efeitos sonoros simples
- **Touch Events**: Suporte para gestos móveis

## 📦 Deploy no GitHub Pages

### Configuração Automática

O projeto inclui um workflow do GitHub Actions que faz deploy automático no GitHub Pages quando você faz push para a branch `main`.

### Deploy Manual

1. Vá para as configurações do repositório no GitHub
2. Ative o GitHub Pages
3. Selecione a branch `main` como fonte
4. Acesse o site em: `https://seu-usuario.github.io/criamundo`

## 🎭 História de Exemplo

**"O Dragão Estelar e a Fada Azul"**

Uma história mágica sobre amizade, criatividade e perseverança, contando a aventura de Draco (um dragão estelar) e Luma (uma fada azul) que criam constelações no céu.

## 🔮 Próximos Passos

### Funcionalidades Futuras

- [ ] Integração com IA para geração de histórias
- [ ] Sistema de reconhecimento de voz real
- [ ] Biblioteca de histórias
- [ ] Sistema de usuários
- [ ] Ilustrações geradas por IA
- [ ] Áudio TTS real
- [ ] Modo offline

### Melhorias Técnicas

- [ ] PWA (Progressive Web App)
- [ ] Cache de recursos
- [ ] Otimização de performance
- [ ] Testes automatizados
- [ ] Internacionalização

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Contato

- **Projeto**: Criamundo
- **Email**: contato@criamundo.com
- **Website**: https://criamundo.com

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório! 