# Configuração da OpenAI para o Criamundo

## Como Configurar sua API Key da OpenAI

### 1. Obter uma API Key da OpenAI

1. Acesse [https://platform.openai.com/](https://platform.openai.com/)
2. Faça login ou crie uma conta
3. Vá para "API Keys" no menu lateral
4. Clique em "Create new secret key"
5. Dê um nome para sua chave (ex: "Criamundo")
6. Copie a chave gerada (ela começa com `sk-`)

### 2. Configurar no Projeto

1. Abra o arquivo `config/ai-config.json`
2. Localize a linha com `"apiKey": "YOUR_OPENAI_API_KEY_HERE"`
3. Substitua `YOUR_OPENAI_API_KEY_HERE` pela sua chave real
4. Salve o arquivo

Exemplo:
```json
{
    "openai": {
        "apiKey": "sk-1234567890abcdef...",
        "model": "gpt-4o-mini",
        ...
    }
}
```

### 3. Verificar a Configuração

1. Abra o console do navegador (F12)
2. Recarregue a página
3. Você deve ver a mensagem: "✅ AI Manager inicializado com OpenAI"

### 4. Testar a Funcionalidade

1. Vá para "Conte sua história"
2. Grave uma mensagem de voz
3. Clique em "Criar Minha História Mágica!"
4. A IA deve gerar uma história personalizada

## Custos da API

- **GPT-4o-mini**: ~$0.15 por 1M tokens
- **Uma história típica**: ~500-1000 tokens
- **Custo por história**: ~$0.000075 - $0.00015

## Troubleshooting

### Erro: "OpenAI API error: 401"
- Verifique se a API key está correta
- Certifique-se de que a conta tem créditos

### Erro: "OpenAI API error: 429"
- Você atingiu o limite de requisições
- Aguarde alguns minutos e tente novamente

### Erro: "OpenAI API error: 500"
- Erro interno da OpenAI
- Tente novamente em alguns minutos

### Não consegue acessar a API
- Verifique sua conexão com a internet
- Certifique-se de que não há firewall bloqueando

## Segurança

⚠️ **IMPORTANTE**: Nunca compartilhe sua API key publicamente!

- Não commite a API key no Git
- Não compartilhe o arquivo de configuração
- Use variáveis de ambiente em produção

## Modo Fallback

Se a API não estiver configurada ou houver erro, o app usará histórias de exemplo pré-definidas, garantindo que sempre funcione para as crianças.

---

**Precisa de ajuda?** Abra uma issue no GitHub do projeto. 