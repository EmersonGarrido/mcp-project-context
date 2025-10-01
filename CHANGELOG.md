# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [2.0.0] - 2025-10-01

### 🎉 Novidades Principais

Esta versão traz uma expansão massiva de funcionalidades, transformando o servidor em uma solução completa para gerenciamento de projetos!

### ✨ Adicionado

#### Banco de Dados (PostgreSQL)
- Ferramenta `db_config` para configurar conexão com PostgreSQL
- Ferramenta `db_query` para executar queries SQL diretamente
- Ferramenta `db_list_tables` para listar todas as tabelas
- Ferramenta `db_describe_table` para ver estrutura completa de tabelas
- Armazenamento seguro de credenciais do banco por projeto

#### Sistema de Tarefas
- Ferramenta `tarefa` para criar tarefas com título, descrição e prioridade
- Ferramenta `tarefas` para listar tarefas por status
- Ferramenta `completar_tarefa` para marcar tarefas como concluídas
- 4 níveis de prioridade: baixa, média, alta, urgente
- 4 status: pendente, em_andamento, concluída, cancelada
- Timestamps automáticos de criação e atualização

#### Histórico e Logs
- Ferramenta `registrar` para registrar eventos importantes
- Ferramenta `historico` para visualizar histórico com filtros
- 5 tipos de eventos: sucesso, erro, atualização, nota, alerta
- Timestamps em todos os registros
- Limite configurável de registros (padrão: 20)

#### Gerenciamento de Processos
- Ferramenta `processos` para listar processos rodando e portas
- Ferramenta `encerrar_processo` para matar processos por porta
- Suporte cross-platform (Windows, macOS, Linux)
- Parse inteligente de netstat (Windows) e lsof (Unix)

#### Novas Categorias de Contexto
- `server_config`: Configurações de servidor (portas, variáveis, etc)
- `deploy_rules`: Regras e processos de deploy

### 🔧 Melhorias
- Estrutura de dados completamente reorganizada e expandida
- Cada projeto agora tem: context, tasks, logs e database
- Ferramenta `projetos` agora mostra estatísticas completas
- Validação melhorada com regras de deploy
- README completamente reescrito com exemplos práticos

### 📦 Dependências
- Adicionado `pg` (^8.13.1) para PostgreSQL
- Adicionado `@types/pg` (^8.11.10) para tipos TypeScript

### 📊 Estatísticas
- **Total de ferramentas**: 18 (antes: 5)
- **Linhas de código**: ~1400 (antes: ~500)
- **Categorias de contexto**: 7 (antes: 5)

---

## [1.0.0] - 2025-10-01

### 🎉 Versão Inicial

#### Adicionado
- Ferramenta `regra` para adicionar regras de negócio, padrões de código, arquivos protegidos, arquitetura e contexto geral
- Ferramenta `contexto` para carregar todo o contexto do projeto
- Ferramenta `validar` para validar mudanças contra as regras definidas
- Ferramenta `projetos` para listar todos os projetos com contexto armazenado
- Ferramenta `remover` para remover regras específicas
- Persistência automática de dados em `~/.mcp-project-context.json`
- Detecção automática do projeto atual baseado no diretório
- Suporte cross-platform (Windows, macOS, Linux)
- Documentação completa no README
- Guia de publicação (PUBLISH.md)

#### Funcionalidades
- Gerenciamento de regras de negócio
- Proteção de arquivos críticos
- Definição de padrões de código
- Documentação de decisões arquiteturais
- Contexto geral do projeto
- Validação de mudanças contra regras
- Estatísticas por categoria
- Suporte a múltiplos projetos simultaneamente

[2.0.0]: https://github.com/seu-usuario/mcp-project-context/releases/tag/v2.0.0
[1.0.0]: https://github.com/seu-usuario/mcp-project-context/releases/tag/v1.0.0
