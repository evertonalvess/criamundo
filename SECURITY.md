# 🔒 Guia de Segurança - CriaMundo

## Proteção da API Key da OpenAI

### ⚠️ IMPORTANTE: Nunca exponha sua API Key

A API Key da OpenAI é uma credencial sensível que deve ser protegida. Nunca a compartilhe ou exponha em código público.

### 🔧 Como Configurar a API Key de Forma Segura

#### Opção 1: Variáveis de Ambiente (Recomendado para Produção)

1. Crie um arquivo `.env` na raiz do projeto:
```bash
OPENAI_API_KEY=sua_api_key_aqui
```

2. Adicione `.env` ao `.gitignore`:
```gitignore
.env
config/ai-config.json
```

3. O app automaticamente detectará a variável de ambiente.

#### Opção 2: Configuração Local (Apenas para Desenvolvimento)

1. Edite o arquivo `config/ai-config.json`
2. Substitua `YOUR_OPENAI_API_KEY_HERE` pela sua API Key real
3. **IMPORTANTE**: Nunca faça commit deste arquivo com a API Key real

### 🛡️ Medidas de Segurança Implementadas

- ✅ Validação de formato da API Key
- ✅ Logs não expõem a chave completa
- ✅ Fallback automático quando API Key não está disponível
- ✅ Verificação de placeholder antes de usar
- ✅ Tratamento de erros de segurança

### 🚨 O que NÃO fazer

- ❌ Nunca commite a API Key no Git
- ❌ Não compartilhe a chave em repositórios públicos
- ❌ Não use a chave em código client-side sem proteção
- ❌ Não deixe a chave em logs ou console

### 🔄 Modo Fallback

Se a API Key não estiver configurada ou for inválida, o app automaticamente usará o modo fallback com histórias locais pré-definidas.

### 📝 Para Desenvolvedores

Para adicionar sua API Key durante o desenvolvimento:

1. Copie `config/ai-config.json` para `config/ai-config.local.json`
2. Configure sua API Key no arquivo local
3. O app detectará automaticamente o arquivo local

```bash
cp config/ai-config.json config/ai-config.local.json
# Edite config/ai-config.local.json com sua API Key
```

### 🔍 Verificação de Segurança

O app inclui verificações automáticas:
- Formato da API Key (deve começar com `sk-`)
- Comprimento mínimo
- Não é o placeholder padrão
- Validação antes de cada chamada

### 📞 Suporte

Se você encontrar problemas de segurança ou precisar de ajuda para configurar a API Key de forma segura, consulte a documentação da OpenAI ou entre em contato com a equipe de desenvolvimento. 