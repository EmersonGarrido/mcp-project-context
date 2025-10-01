# Guia de Publicação

## 1. Inicializar Git e Publicar no GitHub

```bash
# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Criar commit inicial
git commit -m "Initial commit: MCP Project Context Server"

# Criar repositório no GitHub (via gh CLI ou manualmente)
gh repo create mcp-project-context --public --source=. --remote=origin

# Ou adicionar remote manualmente se já criou no GitHub
# git remote add origin https://github.com/seu-usuario/mcp-project-context.git

# Push para o GitHub
git push -u origin main
```

## 2. Publicar no NPM (Opcional)

```bash
# Login no NPM
npm login

# Publicar o pacote
npm publish --access public
```

## 3. Instalar em Outra Máquina

### Opção A: Instalar do GitHub

```bash
# Windows (PowerShell/CMD)
npm install -g git+https://github.com/seu-usuario/mcp-project-context.git

# macOS/Linux
npm install -g git+https://github.com/seu-usuario/mcp-project-context.git
```

### Opção B: Instalar do NPM (se publicou)

```bash
npm install -g mcp-project-context
```

## 4. Configurar no Windows (Claude Code CLI)

### Localização do arquivo de configuração no Windows:
`%APPDATA%\Claude\claude_code_config.json`

Ou geralmente em:
`C:\Users\SeuUsuario\AppData\Roaming\Claude\claude_code_config.json`

### Conteúdo da configuração:

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

### Alternativa se instalou globalmente:

```json
{
  "mcpServers": {
    "project-context": {
      "command": "mcp-project-context"
    }
  }
}
```

## 5. Testar Instalação

```bash
# Verificar se o comando está disponível
mcp-project-context --version

# Ou com npx
npx mcp-project-context --version
```

## 6. Verificar no Claude Code

1. Abra o Claude Code CLI
2. Execute: `Mostre o contexto do projeto`
3. Se o servidor estiver configurado corretamente, ele deve responder

## 7. Atualizar o Servidor

### Se instalou do GitHub:
```bash
npm uninstall -g mcp-project-context
npm install -g git+https://github.com/seu-usuario/mcp-project-context.git
```

### Se instalou do NPM:
```bash
npm update -g mcp-project-context
```

## Troubleshooting Windows

### Erro "mcp-project-context não é reconhecido"
- Use `npx mcp-project-context` ao invés do comando direto
- Ou adicione o diretório global do NPM ao PATH:
  - `%APPDATA%\npm`

### Erro de permissão
- Execute o CMD/PowerShell como Administrador
- Ou use `npm install --global` sem `-g`

### Claude Code não reconhece o servidor
1. Verifique se o arquivo de configuração está no caminho correto
2. Reinicie o Claude Code CLI
3. Verifique os logs em: `%APPDATA%\Claude\logs\`

## Estrutura Final do Projeto

```
mcp-project-context/
├── src/
│   └── index.ts          # Código fonte
├── dist/                 # Código compilado (gerado)
│   ├── index.js
│   ├── index.d.ts
│   └── ...
├── node_modules/         # Dependências (não commitado)
├── package.json          # Configuração do pacote
├── tsconfig.json         # Configuração TypeScript
├── README.md             # Documentação
├── LICENSE               # Licença MIT
├── PUBLISH.md            # Este arquivo
├── example-config.json   # Exemplo de configuração
└── .gitignore           # Arquivos ignorados pelo Git
```

## Boas Práticas

1. **Sempre compile antes de publicar**: `npm run build`
2. **Teste localmente**: `npm install -g .` (no diretório do projeto)
3. **Atualize a versão**: Edite `version` no `package.json` antes de publicar
4. **Crie releases no GitHub**: Use tags para versionar (`git tag v1.0.0`)
