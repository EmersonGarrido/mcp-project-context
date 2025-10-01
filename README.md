# MCP Project Context Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

> Servidor MCP (Model Context Protocol) completo para gerenciar contexto de projetos em desenvolvimento. Mantenha regras de negócio, padrões de código, banco de dados, tarefas e histórico - tudo para que o Claude Code nunca perca informações importantes do seu projeto.

## 🌟 Por que usar?

- **📋 Memória Persistente**: O Claude nunca esquece o contexto do seu projeto
- **🔒 Proteção**: Marque arquivos críticos e valide mudanças
- **💾 Banco de Dados**: Execute queries PostgreSQL diretamente
- **✅ Gestão de Tarefas**: Mantenha TODOs organizados por prioridade
- **📊 Histórico**: Registre eventos importantes do projeto
- **🔧 DevOps**: Gerencie processos e portas em uso
- **🌐 Cross-platform**: Windows, macOS e Linux

## 🚀 Início Rápido

### Instalação

```bash
# NPM (quando publicado)
npm install -g mcp-project-context

# GitHub (instale direto do repositório)
npm install -g git+https://github.com/seu-usuario/mcp-project-context.git

# Ou clone e instale localmente
git clone https://github.com/seu-usuario/mcp-project-context.git
cd mcp-project-context
npm install && npm run build
npm install -g .
```

### Configuração

Adicione ao arquivo de configuração do Claude:

<details>
<summary><b>Claude Desktop (macOS)</b></summary>

Arquivo: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "project-context": {
      "command": "mcp-project-context"
    }
  }
}
```
</details>

<details>
<summary><b>Claude Desktop (Linux)</b></summary>

Arquivo: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "project-context": {
      "command": "mcp-project-context"
    }
  }
}
```
</details>

<details>
<summary><b>Claude Code CLI (Windows)</b></summary>

Arquivo: `%APPDATA%\Claude\claude_code_config.json`

```json
{
  "mcpServers": {
    "project-context": {
      "command": "npx",
      "args": ["mcp-project-context"]
    }
  }
}
```
</details>

<details>
<summary><b>Claude Code CLI (macOS/Linux)</b></summary>

Arquivo: `~/Library/Application Support/Claude/claude_code_config.json` (macOS) ou `~/.config/Claude/claude_code_config.json` (Linux)

```json
{
  "mcpServers": {
    "project-context": {
      "command": "mcp-project-context"
    }
  }
}
```
</details>

Após configurar, reinicie o Claude Desktop ou Claude Code CLI.

## 📚 Funcionalidades

### 📋 Contexto e Regras

Mantenha informações críticas do projeto sempre disponíveis:

```typescript
// Exemplos de uso no Claude Code
"Adicione uma regra de negócio: Usuários premium têm acesso ilimitado"
"Adicione um padrão: Use async/await ao invés de callbacks"
"Adicione arquivo protegido: database/migrations/*"
"Marque como deploy rule: Sempre rodar testes antes do deploy"
```

**Categorias disponíveis:**
- `business_rules` - Regras de negócio
- `protected_files` - Arquivos críticos
- `code_standards` - Padrões de código
- `architecture` - Decisões arquiteturais
- `server_config` - Configurações de servidor
- `deploy_rules` - Processos de deploy
- `context` - Informações gerais

### 💾 Integração com PostgreSQL

Execute queries e explore seu banco de dados sem sair do Claude:

```sql
-- Configure uma vez
"Configure o banco: host localhost, database myapp, user postgres, password secret"

-- Use quantas vezes quiser
"Liste todas as tabelas"
"Descreva a estrutura da tabela users"
"Execute: SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'"
"Execute: UPDATE users SET verified = true WHERE email = 'user@example.com'"
```

### ✅ Sistema de Tarefas

Gerencie TODOs diretamente no projeto:

```typescript
"Adicione tarefa: Implementar autenticação OAuth, prioridade alta"
"Liste todas as tarefas pendentes"
"Marque a tarefa 2 como concluída"
```

**Prioridades:** `baixa` | `média` | `alta` | `urgente`
**Status:** `pendente` | `em_andamento` | `concluída` | `cancelada`

### 📊 Histórico e Logs

Mantenha um registro de eventos importantes:

```typescript
"Registre um sucesso: Deploy v2.1.0 realizado em produção"
"Registre um erro: Falha ao conectar com Redis"
"Registre uma nota: Migração de banco agendada para sexta"
"Mostre o histórico dos últimos 10 eventos"
```

### 🔧 Gerenciamento de Processos

Veja e gerencie processos rodando:

```typescript
"Liste os processos e portas em uso"
"Encerre o processo na porta 3000"
```

Funciona em Windows (netstat), macOS e Linux (lsof).

## 🛠️ Ferramentas Disponíveis

<details>
<summary><b>Contexto e Regras (5 ferramentas)</b></summary>

- **`regra`** - Adiciona regra/contexto ao projeto
- **`contexto`** - Carrega todo o contexto (use no início de cada sessão!)
- **`validar`** - Valida mudanças contra as regras
- **`projetos`** - Lista todos os projetos
- **`remover`** - Remove regra específica
</details>

<details>
<summary><b>Banco de Dados (4 ferramentas)</b></summary>

- **`db_config`** - Configura conexão PostgreSQL
- **`db_query`** - Executa query SQL
- **`db_list_tables`** - Lista tabelas
- **`db_describe_table`** - Descreve estrutura da tabela
</details>

<details>
<summary><b>Tarefas (3 ferramentas)</b></summary>

- **`tarefa`** - Adiciona nova tarefa
- **`tarefas`** - Lista tarefas (com filtros)
- **`completar_tarefa`** - Marca tarefa como concluída
</details>

<details>
<summary><b>Histórico (2 ferramentas)</b></summary>

- **`registrar`** - Registra evento
- **`historico`** - Visualiza histórico
</details>

<details>
<summary><b>Processos (2 ferramentas)</b></summary>

- **`processos`** - Lista processos rodando
- **`encerrar_processo`** - Encerra processo por porta
</details>

**Total:** 18 ferramentas

## 📖 Exemplo Completo

```bash
# Inicie o Claude Code no seu projeto
cd meu-projeto
claude

# 1. Carregue o contexto
"Carregue o contexto do projeto"

# 2. Configure regras e contexto
"Adicione uma regra de negócio: Todos os endpoints requerem autenticação JWT"
"Adicione um padrão de código: Use TypeScript strict mode"
"Adicione arquivo protegido: .env"
"Adicione deploy rule: CI/CD obrigatório para produção"

# 3. Configure banco de dados
"Configure o banco: host localhost, database myapp, user postgres, password dev123"
"Liste todas as tabelas"
"Descreva a tabela users"

# 4. Gerencie tarefas
"Adicione tarefa: Implementar rate limiting na API, prioridade alta"
"Adicione tarefa: Atualizar documentação, prioridade baixa"
"Liste as tarefas"

# 5. Durante desenvolvimento
"Liste os processos rodando"
"Execute: SELECT COUNT(*) FROM users WHERE active = true"
"Registre um sucesso: Feature de rate limiting implementada e testada"

# 6. Valide mudanças antes de fazer
"Valide se posso modificar o arquivo .env"

# 7. Veja o histórico
"Mostre o histórico do projeto"
```

## 🔄 Workflow Recomendado

### Início de Sessão
1. ⚡ Execute `contexto` para carregar todas as regras
2. 📋 Execute `tarefas` para ver o que precisa ser feito

### Durante Desenvolvimento
1. 🔍 Use `validar` antes de mudanças críticas
2. 💾 Use `db_query` para trabalhar com o banco
3. 🔧 Use `processos` para gerenciar servidores
4. 📝 Use `registrar` para documentar eventos

### Manutenção
1. ➕ Use `regra` para adicionar novas regras
2. ✅ Use `tarefa` para adicionar TODOs
3. 🔄 Mantenha atualizado conforme o projeto evolui

## 📊 Estrutura de Dados

Dados salvos em `~/.mcp-project-context.json`:

```json
{
  "meu-projeto": {
    "context": {
      "business_rules": ["Usuários premium têm acesso ilimitado"],
      "protected_files": [".env", "database/migrations/*"],
      "code_standards": ["Use TypeScript strict mode"],
      "architecture": ["Backend usa arquitetura MVC"],
      "server_config": ["API roda na porta 3000"],
      "deploy_rules": ["Sempre rodar testes antes do deploy"],
      "context": ["Usa PostgreSQL e Redis"]
    },
    "database": {
      "host": "localhost",
      "port": 5432,
      "database": "myapp",
      "user": "postgres",
      "password": "secret"
    },
    "tasks": [
      {
        "id": 0,
        "title": "Implementar rate limiting",
        "status": "pendente",
        "priority": "alta",
        "created_at": "2025-01-10T10:00:00Z"
      }
    ],
    "logs": [
      {
        "timestamp": "2025-01-10T10:30:00Z",
        "type": "sucesso",
        "message": "Deploy v2.1.0 realizado"
      }
    ]
  }
}
```

## 🎯 Casos de Uso

### 1. 👨‍💻 Onboarding de Desenvolvedores
Novos desenvolvedores carregam instantaneamente:
- Regras de negócio do projeto
- Padrões de código estabelecidos
- Arquitetura e decisões técnicas
- Configurações e processos

### 2. 🔧 Manutenção de Código Legado
- Documente decisões arquiteturais importantes
- Marque arquivos críticos como protegidos
- Mantenha histórico de mudanças e problemas
- Registre workarounds e technical debt

### 3. 🚀 Deploy e DevOps
- Defina e siga processos de deploy
- Gerencie processos e portas travadas
- Registre sucessos/erros de deploy
- Mantenha configurações de servidor documentadas

### 4. 💾 Desenvolvimento com Banco de Dados
- Execute queries rapidamente sem sair do editor
- Explore estrutura do banco
- Mantenha credenciais por projeto
- Prototipe queries antes de implementar

### 5. 📊 Gestão de Projetos
- Crie e priorize tarefas
- Acompanhe progresso
- Registre marcos importantes
- Mantenha histórico do projeto

## 🔧 Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mcp-project-context.git
cd mcp-project-context

# Instale dependências
npm install

# Desenvolvimento (watch mode)
npm run watch

# Build
npm run build

# Teste localmente
npm install -g .
```

### Estrutura do Projeto

```
mcp-project-context/
├── src/
│   └── index.ts          # Código-fonte principal
├── dist/                 # Build (gerado)
├── package.json          # Configuração e dependências
├── tsconfig.json         # Config TypeScript
├── README.md             # Este arquivo
├── CHANGELOG.md          # Histórico de versões
├── PUBLISH.md            # Guia de publicação
└── LICENSE               # MIT License
```

## 🐛 Troubleshooting

<details>
<summary><b>Servidor não aparece no Claude</b></summary>

1. Verifique o arquivo de configuração está correto
2. Reinicie o Claude Desktop/Code CLI
3. Verifique se `mcp-project-context` está no PATH
4. Tente usar `npx mcp-project-context` na config
</details>

<details>
<summary><b>Erro "command not found"</b></summary>

```bash
# Certifique-se que instalou globalmente
npm install -g mcp-project-context

# Ou use npx na configuração
{
  "command": "npx",
  "args": ["mcp-project-context"]
}
```
</details>

<details>
<summary><b>Erro de conexão com banco de dados</b></summary>

1. Verifique se o PostgreSQL está rodando
2. Confirme host, porta, usuário e senha
3. Teste a conexão manualmente:
   ```bash
   psql -h localhost -U postgres -d myapp
   ```
4. Verifique firewall e permissões
</details>

<details>
<summary><b>Processo não encerra</b></summary>

**Windows:**
- Pode precisar executar como Administrador
- Verifique o PID manualmente: `netstat -ano | findstr :3000`

**macOS/Linux:**
- Tente manualmente: `lsof -ti:3000 | xargs kill -9`
- Verifique permissões do usuário
</details>

<details>
<summary><b>Dados não são salvos</b></summary>

1. Verifique permissões em `~/.mcp-project-context.json`
2. O arquivo é criado automaticamente na primeira execução
3. Teste criando manualmente:
   ```bash
   touch ~/.mcp-project-context.json
   chmod 644 ~/.mcp-project-context.json
   ```
</details>

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Este é um projeto open source.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Ideias de Contribuição

- 🐛 Reporte bugs
- 💡 Sugira novas funcionalidades
- 📝 Melhore a documentação
- 🧪 Adicione testes
- 🌐 Traduza para outros idiomas
- ⚡ Otimize performance

## 🌟 Roadmap

Funcionalidades planejadas para versões futuras:

- [ ] Suporte a MySQL/MariaDB
- [ ] Suporte a MongoDB
- [ ] Suporte a SQLite
- [ ] Exportar/Importar contexto (JSON, YAML)
- [ ] Integração com Git (hooks, branches, commits)
- [ ] Subtarefas e checklists
- [ ] Notificações de tarefas vencidas
- [ ] Métricas de produtividade
- [ ] Backup automático em cloud
- [ ] Sincronização entre máquinas
- [ ] Integração com Jira/Trello/GitHub Issues
- [ ] Dashboard web (visualização)
- [ ] Suporte a templates de projeto
- [ ] API REST para integração externa

Vote nas features que você quer! Abra uma issue com 👍

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [Anthropic](https://www.anthropic.com/) - Pelo Claude e o Model Context Protocol
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - SDK oficial do MCP
- Comunidade open source

## 📞 Suporte

- 🐛 **Bugs**: [Abra uma issue](https://github.com/seu-usuario/mcp-project-context/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/mcp-project-context/discussions)
- 📧 **Email**: seu-email@example.com

---

**Versão:** 2.0.0
**Última atualização:** Janeiro 2025

Feito com ❤️ para a comunidade Claude Code

⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!
