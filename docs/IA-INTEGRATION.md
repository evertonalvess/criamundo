# 🤖 Integração com IA - Criamundo

Este documento descreve a implementação da integração com Inteligência Artificial no Criamundo.

## 📋 Visão Geral

A integração com IA permite que o Criamundo:
- Gere histórias automaticamente baseadas em parâmetros
- Processe entrada de voz para criar histórias personalizadas
- Crie ilustrações e áudio usando IA
- Forneça uma experiência mais rica e interativa

## 🏗️ Arquitetura

### Módulos Principais

1. **AI Manager** (`js/ai-manager.js`)
   - Gerencia integração com provedores de IA
   - Processa geração de histórias, imagens e áudio
   - Fornece fallbacks quando IA não está disponível

2. **Voice Manager** (`js/voice-manager.js`)
   - Gerencia reconhecimento de voz (Speech Recognition)
   - Controla síntese de voz (Text-to-Speech)
   - Processa entrada de voz para extrair parâmetros

3. **Screen Manager** (`script.js`)
   - Coordena navegação entre telas
   - Integra os módulos de IA e voz
   - Gerencia o fluxo de criação de histórias

### Configuração

O arquivo `config/ai-config.json` contém todas as configurações:
- Provedores de IA (OpenAI, Anthropic, Local)
- Prompts para diferentes tarefas
- Configurações de voz e imagem
- Mensagens de interface

## 🔧 Provedores de IA Suportados

### 1. OpenAI
```json
{
  "openai": {
    "enabled": true,
    "apiKey": "sua-chave-aqui",
    "model": "gpt-4",
    "maxTokens": 1000,
    "temperature": 0.8
  }
}
```

### 2. Anthropic (Claude)
```json
{
  "anthropic": {
    "enabled": true,
    "apiKey": "sua-chave-aqui",
    "model": "claude-3-sonnet",
    "maxTokens": 1000
  }
}
```

### 3. API Local
```json
{
  "local": {
    "enabled": true,
    "endpoint": "http://localhost:3000/generate",
    "model": "llama-3.1-8b"
  }
}
```

## 🎤 Funcionalidades de Voz

### Reconhecimento de Voz
- Captura fala em tempo real
- Processa texto para extrair parâmetros
- Suporte para português brasileiro
- Interface visual com ondas sonoras

### Síntese de Voz
- Narração automática das histórias
- Voz em português brasileiro
- Controle de velocidade e tom
- Fallback para simulação quando não disponível

### Processamento de Entrada
O sistema extrai automaticamente:
- **Temas**: amizade, coragem, cooperação, etc.
- **Personagens**: gato, dragão, princesa, etc.
- **Cenários**: floresta, castelo, espaço, etc.

## 📝 Geração de Histórias

### Prompts Estruturados
```javascript
// Exemplo de prompt para geração
const prompt = `Crie uma história curta e mágica sobre ${tema} 
com personagens ${personagens}. A história deve ter entre 3-5 
parágrafos, ser educativa e divertida para crianças de 4-9 anos.`;
```

### Estrutura da História
```javascript
{
  id: "story-1234567890",
  title: "Título da História",
  paragraphs: [
    {
      id: 1,
      text: "Primeiro parágrafo...",
      illustration: "scene-1",
      audioDuration: 15
    }
  ],
  metadata: {
    createdAt: "2024-01-01T00:00:00Z",
    generatedBy: "ai",
    wordCount: 156
  }
}
```

## 🎨 Geração de Imagens

### Configuração
```json
{
  "imageGeneration": {
    "enabled": true,
    "provider": "dalle",
    "style": "children-book",
    "size": "1024x1024"
  }
}
```

### Prompt para Imagens
```javascript
const imagePrompt = `Crie uma ilustração para a história '${titulo}' 
mostrando ${cena}. Estilo: infantil, colorido, seguro para crianças.`;
```

## 🔊 Geração de Áudio

### Configuração
```json
{
  "textToSpeech": {
    "enabled": true,
    "provider": "web-speech-api",
    "voice": "pt-BR",
    "rate": 0.9,
    "pitch": 1.0
  }
}
```

## 🛡️ Sistema de Fallback

### Quando IA Não Está Disponível
1. **Histórias**: Usa história de exemplo pré-definida
2. **Imagens**: Gera SVG com emojis
3. **Áudio**: Simula reprodução com Web Audio API
4. **Voz**: Desabilita funcionalidades de voz

### Mensagens de Erro
```javascript
{
  "errorMessages": {
    "network": "Ops! Parece que perdemos a conexão. Tente novamente!",
    "ai": "A IA está descansando. Vamos usar uma história especial!",
    "voice": "Não consegui ouvir bem. Pode falar mais alto?",
    "general": "Algo deu errado. Vamos tentar de novo?"
  }
}
```

## 🚀 Como Ativar a IA

### 1. Configurar Provedor
Edite `config/ai-config.json`:
```json
{
  "ai": {
    "enabled": true,
    "providers": {
      "openai": {
        "enabled": true,
        "apiKey": "sua-chave-aqui"
      }
    }
  }
}
```

### 2. Configurar Funcionalidades
```json
{
  "features": {
    "voiceRecognition": { "enabled": true },
    "textToSpeech": { "enabled": true },
    "imageGeneration": { "enabled": true }
  }
}
```

### 3. Testar
- Acesse a tela inicial
- Clique em "Criar História com IA"
- Configure parâmetros e gere uma história

## 🔒 Segurança

### Boas Práticas
- **Nunca** commite chaves de API no repositório
- Use variáveis de ambiente para chaves sensíveis
- Valide entrada de usuário antes de enviar para IA
- Implemente rate limiting para APIs externas

### Configuração Segura
```javascript
// Em produção, use variáveis de ambiente
const apiKey = process.env.OPENAI_API_KEY || '';
```

## 📊 Monitoramento

### Logs Importantes
```javascript
// Logs para monitorar
console.log('AI Manager inicializado com sucesso');
console.log('Reconhecimento de voz iniciado');
console.log('História gerada:', storyId);
console.error('Erro na API de IA:', error);
```

### Métricas Sugeridas
- Taxa de sucesso na geração de histórias
- Tempo de resposta das APIs
- Uso de funcionalidades de voz
- Erros por provedor de IA

## 🔮 Próximos Passos

### Melhorias Planejadas
1. **Cache de Histórias**: Evitar regeneração de histórias similares
2. **Personalização**: Aprender preferências do usuário
3. **Múltiplas Vozes**: Diferentes narradores para personagens
4. **Animações IA**: Gerar animações baseadas na história
5. **Colaboração**: Histórias criadas por múltiplas crianças

### Integrações Futuras
- **Stable Diffusion**: Para imagens mais realistas
- **ElevenLabs**: Para vozes mais naturais
- **Whisper**: Para reconhecimento de voz mais preciso
- **Claude Sonnet**: Para histórias mais complexas

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. IA Não Gera Histórias
- Verificar se `ai.enabled` está `true`
- Confirmar chave de API válida
- Verificar conectividade com internet

#### 2. Voz Não Funciona
- Verificar permissões do microfone
- Confirmar suporte do navegador
- Testar em HTTPS (requerido para Speech API)

#### 3. Imagens Não Aparecem
- Verificar configuração do provedor de imagens
- Confirmar quota da API
- Verificar formato de resposta

### Debug
```javascript
// Adicione ao console para debug
console.log('AI Status:', aiManager.getStatus());
console.log('Voice Status:', voiceManager.getStatus());
console.log('Config:', aiManager.config);
```

## 📚 Recursos Adicionais

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic API](https://docs.anthropic.com/)
- [Speech Synthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

---

**Nota**: Esta integração está em desenvolvimento ativo. Novas funcionalidades serão adicionadas conforme necessário. 