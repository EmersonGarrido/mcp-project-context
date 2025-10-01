#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import pg from "pg";

const execAsync = promisify(exec);
const { Client } = pg;

interface ProjectContext {
  business_rules: string[];
  protected_files: string[];
  code_standards: string[];
  architecture: string[];
  context: string[];
  server_config: string[];
  deploy_rules: string[];
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "pendente" | "em_andamento" | "concluída" | "cancelada";
  priority: "baixa" | "média" | "alta" | "urgente";
  created_at: string;
  updated_at: string;
}

interface LogEntry {
  timestamp: string;
  type: "sucesso" | "erro" | "atualização" | "nota" | "alerta";
  message: string;
  details?: string;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface ProjectData {
  [projectName: string]: {
    context: ProjectContext;
    tasks: Task[];
    logs: LogEntry[];
    database?: DatabaseConfig;
  };
}

class ProjectContextServer {
  private server: Server;
  private dataPath: string;
  private data: ProjectData;

  constructor() {
    this.server = new Server(
      {
        name: "project-context",
        version: "2.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.dataPath = path.join(os.homedir(), ".mcp-project-context.json");
    this.data = this.loadData();

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private loadData(): ProjectData {
    try {
      if (fs.existsSync(this.dataPath)) {
        const content = fs.readFileSync(this.dataPath, "utf-8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    return {};
  }

  private saveData(): void {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  }

  private detectProject(): string {
    const cwd = process.cwd();
    return path.basename(cwd);
  }

  private ensureProject(projectName: string): void {
    if (!this.data[projectName]) {
      this.data[projectName] = {
        context: {
          business_rules: [],
          protected_files: [],
          code_standards: [],
          architecture: [],
          context: [],
          server_config: [],
          deploy_rules: [],
        },
        tasks: [],
        logs: [],
      };
    }
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        // CONTEXTO E REGRAS
        {
          name: "regra",
          description:
            "Adiciona uma regra de negócio ou contexto para o projeto atual. Use para guardar informações importantes que não devem ser esquecidas.",
          inputSchema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description:
                  "Categoria da regra: business_rules, protected_files, code_standards, architecture, context, server_config, deploy_rules",
                enum: [
                  "business_rules",
                  "protected_files",
                  "code_standards",
                  "architecture",
                  "context",
                  "server_config",
                  "deploy_rules",
                ],
              },
              rule: {
                type: "string",
                description: "A regra ou contexto a ser adicionado",
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
            required: ["category", "rule"],
          },
        },
        {
          name: "contexto",
          description:
            "Obtém todo o contexto e regras do projeto atual. USE ESTA FERRAMENTA NO INÍCIO DE CADA SESSÃO para carregar o contexto.",
          inputSchema: {
            type: "object",
            properties: {
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
              category: {
                type: "string",
                description: "Filtrar por categoria específica (opcional)",
                enum: [
                  "business_rules",
                  "protected_files",
                  "code_standards",
                  "architecture",
                  "context",
                  "server_config",
                  "deploy_rules",
                ],
              },
            },
          },
        },
        {
          name: "projetos",
          description:
            "Lista todos os projetos com contexto armazenado e estatísticas detalhadas de cada categoria",
          inputSchema: {
            type: "object",
            properties: {
              detailed: {
                type: "boolean",
                description:
                  "Mostrar estatísticas detalhadas por categoria (padrão: true)",
              },
            },
          },
        },
        {
          name: "remover",
          description: "Remove uma regra específica do projeto",
          inputSchema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "Categoria da regra a remover",
                enum: [
                  "business_rules",
                  "protected_files",
                  "code_standards",
                  "architecture",
                  "context",
                  "server_config",
                  "deploy_rules",
                ],
              },
              index: {
                type: "number",
                description: "Índice da regra a remover (baseado em 0)",
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
            required: ["category", "index"],
          },
        },
        {
          name: "validar",
          description:
            "Valida se mudanças planejadas violam alguma regra do projeto",
          inputSchema: {
            type: "object",
            properties: {
              changes_description: {
                type: "string",
                description: "Descrição das mudanças que serão feitas",
              },
              files_affected: {
                type: "array",
                items: { type: "string" },
                description: "Lista de arquivos que serão modificados",
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
            required: ["changes_description"],
          },
        },

        // GERENCIAMENTO DE PROCESSOS
        {
          name: "processos",
          description: "Lista todos os processos Node.js rodando com suas portas",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "encerrar_processo",
          description: "Encerra um processo específico pela porta",
          inputSchema: {
            type: "object",
            properties: {
              port: {
                type: "number",
                description: "Porta do processo a ser encerrado",
              },
            },
            required: ["port"],
          },
        },

        // BANCO DE DADOS
        {
          name: "db_config",
          description:
            "Configura a conexão com o banco de dados PostgreSQL para o projeto atual",
          inputSchema: {
            type: "object",
            properties: {
              host: {
                type: "string",
                description: "Host do banco de dados (ex: localhost, 54.198.204.191)",
              },
              port: {
                type: "number",
                description: "Porta do banco de dados (padrão: 5432)",
              },
              database: {
                type: "string",
                description: "Nome do banco de dados",
              },
              user: {
                type: "string",
                description: "Usuário do banco de dados",
              },
              password: {
                type: "string",
                description: "Senha do banco de dados",
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
            required: ["host", "database", "user", "password"],
          },
        },
        {
          name: "db_query",
          description:
            "Executa uma query SQL no banco de dados PostgreSQL do projeto",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "Query SQL a ser executada (SELECT, INSERT, UPDATE, etc)",
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "db_list_tables",
          description:
            "Lista todas as tabelas do banco de dados PostgreSQL do projeto",
          inputSchema: {
            type: "object",
            properties: {
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
          },
        },
        {
          name: "db_describe_table",
          description:
            "Descreve a estrutura de uma tabela (colunas, tipos, constraints)",
          inputSchema: {
            type: "object",
            properties: {
              table_name: {
                type: "string",
                description: "Nome da tabela a ser descrita",
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
            required: ["table_name"],
          },
        },

        // TAREFAS
        {
          name: "tarefa",
          description:
            "Adiciona uma nova tarefa ao projeto para controlar o que precisa ser feito",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Título da tarefa",
              },
              description: {
                type: "string",
                description: "Descrição detalhada da tarefa (opcional)",
              },
              priority: {
                type: "string",
                description: "Prioridade da tarefa",
                enum: ["baixa", "média", "alta", "urgente"],
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
            required: ["title"],
          },
        },
        {
          name: "tarefas",
          description:
            "Lista todas as tarefas do projeto (pendentes, em andamento, concluídas)",
          inputSchema: {
            type: "object",
            properties: {
              status: {
                type: "string",
                description: "Filtrar por status (opcional)",
                enum: ["pendente", "em_andamento", "concluída", "cancelada"],
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
          },
        },
        {
          name: "completar_tarefa",
          description: "Marca uma tarefa como concluída",
          inputSchema: {
            type: "object",
            properties: {
              task_id: {
                type: "number",
                description: "ID da tarefa (índice baseado em 0)",
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
            required: ["task_id"],
          },
        },

        // LOGS E HISTÓRICO
        {
          name: "registrar",
          description:
            "Registra um evento importante: sucesso, erro, atualização, nota",
          inputSchema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                description: "Tipo de registro",
                enum: ["sucesso", "erro", "atualização", "nota", "alerta"],
              },
              message: {
                type: "string",
                description: "Mensagem do registro",
              },
              details: {
                type: "string",
                description: "Detalhes adicionais (opcional)",
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
            required: ["type", "message"],
          },
        },
        {
          name: "historico",
          description:
            "Mostra o histórico de eventos do projeto (sucessos, erros, atualizações)",
          inputSchema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                description: "Filtrar por tipo (opcional)",
                enum: ["sucesso", "erro", "atualização", "nota", "alerta"],
              },
              limit: {
                type: "number",
                description: "Limitar quantidade de registros (padrão: 20)",
              },
              project: {
                type: "string",
                description:
                  "Nome do projeto (opcional, detecta automaticamente se não fornecido)",
              },
            },
          },
        },
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Contexto e regras
          case "regra":
            return await this.handleAddRule(args);
          case "contexto":
            return await this.handleGetContext(args);
          case "projetos":
            return await this.handleListProjects(args);
          case "remover":
            return await this.handleRemoveRule(args);
          case "validar":
            return await this.handleValidate(args);

          // Processos
          case "processos":
            return await this.handleListProcesses();
          case "encerrar_processo":
            return await this.handleKillProcess(args);

          // Banco de dados
          case "db_config":
            return await this.handleDatabaseConfig(args);
          case "db_query":
            return await this.handleDatabaseQuery(args);
          case "db_list_tables":
            return await this.handleListTables(args);
          case "db_describe_table":
            return await this.handleDescribeTable(args);

          // Tarefas
          case "tarefa":
            return await this.handleAddTask(args);
          case "tarefas":
            return await this.handleListTasks(args);
          case "completar_tarefa":
            return await this.handleCompleteTask(args);

          // Logs
          case "registrar":
            return await this.handleLog(args);
          case "historico":
            return await this.handleHistory(args);

          default:
            throw new Error(`Ferramenta desconhecida: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Erro: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  // ==================== CONTEXTO E REGRAS ====================

  private async handleAddRule(args: any) {
    const projectName = args.project || this.detectProject();
    const category = args.category as keyof ProjectContext;
    const rule = args.rule as string;

    this.ensureProject(projectName);
    this.data[projectName].context[category].push(rule);
    this.saveData();

    return {
      content: [
        {
          type: "text",
          text: `✓ Regra adicionada ao projeto "${projectName}" na categoria "${category}":\n${rule}\n\nTotal de regras nesta categoria: ${this.data[projectName].context[category].length}`,
        },
      ],
    };
  }

  private async handleGetContext(args: any) {
    const projectName = args.project || this.detectProject();
    const category = args.category as keyof ProjectContext | undefined;

    if (!this.data[projectName]) {
      return {
        content: [
          {
            type: "text",
            text: `Nenhum contexto encontrado para o projeto "${projectName}".\n\nUse a ferramenta "regra" para adicionar regras de negócio, padrões de código, arquivos protegidos, etc.`,
          },
        ],
      };
    }

    const context = this.data[projectName].context;
    let output = `# Contexto do Projeto: ${projectName}\n\n`;

    const categories: (keyof ProjectContext)[] = category
      ? [category]
      : [
          "business_rules",
          "protected_files",
          "code_standards",
          "architecture",
          "context",
          "server_config",
          "deploy_rules",
        ];

    const categoryNames = {
      business_rules: "Regras de Negócio",
      protected_files: "Arquivos Protegidos",
      code_standards: "Padrões de Código",
      architecture: "Arquitetura",
      context: "Contexto Geral",
      server_config: "Configuração de Servidor",
      deploy_rules: "Regras de Deploy",
    };

    for (const cat of categories) {
      const rules = context[cat];
      if (rules.length > 0) {
        output += `## ${categoryNames[cat]} (${rules.length})\n`;
        rules.forEach((rule, index) => {
          output += `${index + 1}. ${rule}\n`;
        });
        output += "\n";
      }
    }

    if (output === `# Contexto do Projeto: ${projectName}\n\n`) {
      output += "Nenhuma regra definida ainda.";
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }

  private async handleListProjects(args: any) {
    const detailed = args.detailed !== false;

    if (Object.keys(this.data).length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "Nenhum projeto com contexto armazenado.",
          },
        ],
      };
    }

    let output = "# Projetos com Contexto Armazenado\n\n";

    for (const [projectName, projectData] of Object.entries(this.data)) {
      const context = projectData.context;
      const total = Object.values(context).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      output += `## ${projectName}\n`;
      output += `Total de regras: ${total}\n`;
      output += `Tarefas: ${projectData.tasks.length}\n`;
      output += `Logs: ${projectData.logs.length}\n`;
      output += `Banco de dados: ${projectData.database ? "Configurado" : "Não configurado"}\n`;

      if (detailed) {
        output += `\n### Detalhes das Regras:\n`;
        output += `- Regras de Negócio: ${context.business_rules.length}\n`;
        output += `- Arquivos Protegidos: ${context.protected_files.length}\n`;
        output += `- Padrões de Código: ${context.code_standards.length}\n`;
        output += `- Arquitetura: ${context.architecture.length}\n`;
        output += `- Contexto Geral: ${context.context.length}\n`;
        output += `- Configuração de Servidor: ${context.server_config.length}\n`;
        output += `- Regras de Deploy: ${context.deploy_rules.length}\n`;
      }
      output += "\n";
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }

  private async handleRemoveRule(args: any) {
    const projectName = args.project || this.detectProject();
    const category = args.category as keyof ProjectContext;
    const index = args.index as number;

    if (!this.data[projectName]) {
      throw new Error(`Projeto "${projectName}" não encontrado`);
    }

    const rules = this.data[projectName].context[category];
    if (index < 0 || index >= rules.length) {
      throw new Error(`Índice ${index} inválido para a categoria "${category}"`);
    }

    const removedRule = rules.splice(index, 1)[0];
    this.saveData();

    return {
      content: [
        {
          type: "text",
          text: `✓ Regra removida do projeto "${projectName}" na categoria "${category}":\n${removedRule}`,
        },
      ],
    };
  }

  private async handleValidate(args: any) {
    const projectName = args.project || this.detectProject();
    const changesDescription = args.changes_description as string;
    const filesAffected = (args.files_affected as string[]) || [];

    if (!this.data[projectName]) {
      return {
        content: [
          {
            type: "text",
            text: `Nenhum contexto definido para "${projectName}". Não há regras para validar.`,
          },
        ],
      };
    }

    const context = this.data[projectName].context;
    let warnings: string[] = [];

    if (filesAffected.length > 0 && context.protected_files.length > 0) {
      for (const file of filesAffected) {
        for (const protectedPattern of context.protected_files) {
          if (file.includes(protectedPattern) || file.match(protectedPattern)) {
            warnings.push(
              `⚠️ Arquivo protegido será modificado: ${file} (regra: ${protectedPattern})`
            );
          }
        }
      }
    }

    let output = `# Validação de Mudanças - ${projectName}\n\n`;
    output += `## Mudanças Descritas\n${changesDescription}\n\n`;

    if (filesAffected.length > 0) {
      output += `## Arquivos Afetados\n`;
      filesAffected.forEach((f) => (output += `- ${f}\n`));
      output += "\n";
    }

    if (warnings.length > 0) {
      output += `## ⚠️ Avisos\n`;
      warnings.forEach((w) => (output += `${w}\n`));
      output += "\n";
    }

    output += `## Regras a Considerar\n\n`;

    const allRules = [
      ...context.business_rules.map((r) => `[Negócio] ${r}`),
      ...context.code_standards.map((r) => `[Padrão] ${r}`),
      ...context.architecture.map((r) => `[Arquitetura] ${r}`),
      ...context.deploy_rules.map((r) => `[Deploy] ${r}`),
    ];

    if (allRules.length > 0) {
      allRules.forEach((r) => (output += `- ${r}\n`));
    } else {
      output += "Nenhuma regra específica definida.\n";
    }

    output += "\n";
    output += warnings.length > 0
      ? "⚠️ Atenção aos avisos acima antes de prosseguir."
      : "✓ Nenhum conflito detectado com arquivos protegidos.";

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }

  // ==================== PROCESSOS ====================

  private async handleListProcesses() {
    try {
      const { stdout } = await execAsync(
        process.platform === "win32"
          ? 'netstat -ano | findstr "LISTENING"'
          : "lsof -iTCP -sTCP:LISTEN -n -P"
      );

      let output = "# Processos Rodando\n\n";

      if (process.platform === "win32") {
        // Parse Windows netstat
        const lines = stdout.split("\n").filter((line) => line.includes("LISTENING"));
        const ports = new Set<string>();

        lines.forEach((line) => {
          const match = line.match(/:(\d+)/);
          if (match) {
            ports.add(match[1]);
          }
        });

        if (ports.size > 0) {
          output += "## Portas em uso:\n";
          Array.from(ports).sort().forEach((port) => {
            output += `- Porta ${port}\n`;
          });
        } else {
          output += "Nenhum processo encontrado.\n";
        }
      } else {
        // Parse Unix lsof
        const lines = stdout.split("\n").slice(1);
        const processes = new Map<string, string[]>();

        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 9) {
            const name = parts[0];
            const port = parts[8].split(":").pop() || "";
            if (!processes.has(name)) {
              processes.set(name, []);
            }
            if (port && !isNaN(Number(port))) {
              processes.get(name)!.push(port);
            }
          }
        });

        if (processes.size > 0) {
          output += "## Processos por porta:\n";
          for (const [name, ports] of processes.entries()) {
            output += `\n### ${name}\n`;
            ports.forEach((port) => {
              output += `- Porta ${port}\n`;
            });
          }
        } else {
          output += "Nenhum processo encontrado.\n";
        }
      }

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erro ao listar processos: ${error}`,
          },
        ],
      };
    }
  }

  private async handleKillProcess(args: any) {
    const port = args.port as number;

    try {
      if (process.platform === "win32") {
        const { stdout } = await execAsync(
          `netstat -ano | findstr ":${port}"`
        );
        const lines = stdout.split("\n");
        const pids = new Set<string>();

        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(Number(pid))) {
            pids.add(pid);
          }
        });

        for (const pid of pids) {
          await execAsync(`taskkill /F /PID ${pid}`);
        }

        return {
          content: [
            {
              type: "text",
              text: `✓ Processo(s) na porta ${port} encerrado(s) com sucesso.`,
            },
          ],
        };
      } else {
        await execAsync(`lsof -ti:${port} | xargs kill -9`);
        return {
          content: [
            {
              type: "text",
              text: `✓ Processo na porta ${port} encerrado com sucesso.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erro ao encerrar processo na porta ${port}: ${error}`,
          },
        ],
      };
    }
  }

  // ==================== BANCO DE DADOS ====================

  private async handleDatabaseConfig(args: any) {
    const projectName = args.project || this.detectProject();
    const config: DatabaseConfig = {
      host: args.host,
      port: args.port || 5432,
      database: args.database,
      user: args.user,
      password: args.password,
    };

    this.ensureProject(projectName);
    this.data[projectName].database = config;
    this.saveData();

    return {
      content: [
        {
          type: "text",
          text: `✓ Configuração de banco de dados salva para "${projectName}":\n- Host: ${config.host}:${config.port}\n- Database: ${config.database}\n- User: ${config.user}`,
        },
      ],
    };
  }

  private async getDatabaseClient(projectName: string): Promise<pg.Client> {
    if (!this.data[projectName] || !this.data[projectName].database) {
      throw new Error(
        `Banco de dados não configurado para o projeto "${projectName}". Use a ferramenta "db_config" primeiro.`
      );
    }

    const config = this.data[projectName].database!;
    const client = new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });

    await client.connect();
    return client;
  }

  private async handleDatabaseQuery(args: any) {
    const projectName = args.project || this.detectProject();
    const query = args.query as string;

    let client: pg.Client | null = null;

    try {
      client = await this.getDatabaseClient(projectName);
      const result = await client.query(query);

      let output = `# Resultado da Query\n\n`;
      output += `\`\`\`sql\n${query}\n\`\`\`\n\n`;

      if (result.command === "SELECT" && result.rows.length > 0) {
        output += `## Resultados (${result.rowCount} linhas)\n\n`;
        output += "```json\n";
        output += JSON.stringify(result.rows, null, 2);
        output += "\n```\n";
      } else if (result.command === "INSERT") {
        output += `✓ ${result.rowCount} linha(s) inserida(s)\n`;
      } else if (result.command === "UPDATE") {
        output += `✓ ${result.rowCount} linha(s) atualizada(s)\n`;
      } else if (result.command === "DELETE") {
        output += `✓ ${result.rowCount} linha(s) deletada(s)\n`;
      } else {
        output += `✓ Query executada com sucesso\n`;
        if (result.rowCount) {
          output += `Linhas afetadas: ${result.rowCount}\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erro ao executar query: ${error}`,
          },
        ],
      };
    } finally {
      if (client) {
        await client.end();
      }
    }
  }

  private async handleListTables(args: any) {
    const projectName = args.project || this.detectProject();

    let client: pg.Client | null = null;

    try {
      client = await this.getDatabaseClient(projectName);
      const result = await client.query(`
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);

      let output = `# Tabelas do Banco de Dados\n\n`;
      output += `Total: ${result.rowCount} tabela(s)\n\n`;

      result.rows.forEach((row) => {
        output += `- ${row.table_name} (${row.table_type})\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erro ao listar tabelas: ${error}`,
          },
        ],
      };
    } finally {
      if (client) {
        await client.end();
      }
    }
  }

  private async handleDescribeTable(args: any) {
    const projectName = args.project || this.detectProject();
    const tableName = args.table_name as string;

    let client: pg.Client | null = null;

    try {
      client = await this.getDatabaseClient(projectName);
      const result = await client.query(
        `
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `,
        [tableName]
      );

      if (result.rowCount === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Tabela "${tableName}" não encontrada.`,
            },
          ],
        };
      }

      let output = `# Estrutura da Tabela: ${tableName}\n\n`;
      output += `| Coluna | Tipo | Tamanho | Nullable | Default |\n`;
      output += `|--------|------|---------|----------|----------|\n`;

      result.rows.forEach((row) => {
        const length = row.character_maximum_length || "-";
        const nullable = row.is_nullable === "YES" ? "Sim" : "Não";
        const defaultVal = row.column_default || "-";
        output += `| ${row.column_name} | ${row.data_type} | ${length} | ${nullable} | ${defaultVal} |\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erro ao descrever tabela: ${error}`,
          },
        ],
      };
    } finally {
      if (client) {
        await client.end();
      }
    }
  }

  // ==================== TAREFAS ====================

  private async handleAddTask(args: any) {
    const projectName = args.project || this.detectProject();
    const title = args.title as string;
    const description = args.description as string | undefined;
    const priority = (args.priority as Task["priority"]) || "média";

    this.ensureProject(projectName);

    const task: Task = {
      id: this.data[projectName].tasks.length,
      title,
      description,
      status: "pendente",
      priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data[projectName].tasks.push(task);
    this.saveData();

    return {
      content: [
        {
          type: "text",
          text: `✓ Tarefa adicionada ao projeto "${projectName}":\n\nID: ${task.id}\nTítulo: ${task.title}\nPrioridade: ${task.priority}\nStatus: ${task.status}`,
        },
      ],
    };
  }

  private async handleListTasks(args: any) {
    const projectName = args.project || this.detectProject();
    const statusFilter = args.status as Task["status"] | undefined;

    if (!this.data[projectName] || this.data[projectName].tasks.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `Nenhuma tarefa encontrada para o projeto "${projectName}".`,
          },
        ],
      };
    }

    let tasks = this.data[projectName].tasks;
    if (statusFilter) {
      tasks = tasks.filter((t) => t.status === statusFilter);
    }

    let output = `# Tarefas do Projeto: ${projectName}\n\n`;

    const statusGroups = {
      pendente: tasks.filter((t) => t.status === "pendente"),
      em_andamento: tasks.filter((t) => t.status === "em_andamento"),
      concluída: tasks.filter((t) => t.status === "concluída"),
      cancelada: tasks.filter((t) => t.status === "cancelada"),
    };

    const statusEmoji = {
      pendente: "⏳",
      em_andamento: "🔄",
      concluída: "✅",
      cancelada: "❌",
    };

    for (const [status, statusTasks] of Object.entries(statusGroups)) {
      if (statusTasks.length > 0) {
        output += `## ${statusEmoji[status as Task["status"]]} ${status.toUpperCase()} (${statusTasks.length})\n\n`;
        statusTasks.forEach((task) => {
          output += `### [${task.id}] ${task.title}\n`;
          if (task.description) {
            output += `${task.description}\n`;
          }
          output += `Prioridade: ${task.priority} | Criada: ${new Date(task.created_at).toLocaleDateString()}\n\n`;
        });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }

  private async handleCompleteTask(args: any) {
    const projectName = args.project || this.detectProject();
    const taskId = args.task_id as number;

    if (!this.data[projectName]) {
      throw new Error(`Projeto "${projectName}" não encontrado`);
    }

    const task = this.data[projectName].tasks[taskId];
    if (!task) {
      throw new Error(`Tarefa com ID ${taskId} não encontrada`);
    }

    task.status = "concluída";
    task.updated_at = new Date().toISOString();
    this.saveData();

    return {
      content: [
        {
          type: "text",
          text: `✓ Tarefa [${taskId}] "${task.title}" marcada como concluída!`,
        },
      ],
    };
  }

  // ==================== LOGS E HISTÓRICO ====================

  private async handleLog(args: any) {
    const projectName = args.project || this.detectProject();
    const type = args.type as LogEntry["type"];
    const message = args.message as string;
    const details = args.details as string | undefined;

    this.ensureProject(projectName);

    const log: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      details,
    };

    this.data[projectName].logs.push(log);
    this.saveData();

    const emoji = {
      sucesso: "✅",
      erro: "❌",
      atualização: "🔄",
      nota: "📝",
      alerta: "⚠️",
    };

    return {
      content: [
        {
          type: "text",
          text: `${emoji[type]} Registro adicionado ao histórico do projeto "${projectName}":\n${message}`,
        },
      ],
    };
  }

  private async handleHistory(args: any) {
    const projectName = args.project || this.detectProject();
    const typeFilter = args.type as LogEntry["type"] | undefined;
    const limit = (args.limit as number) || 20;

    if (!this.data[projectName] || this.data[projectName].logs.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `Nenhum registro no histórico do projeto "${projectName}".`,
          },
        ],
      };
    }

    let logs = this.data[projectName].logs;
    if (typeFilter) {
      logs = logs.filter((l) => l.type === typeFilter);
    }

    logs = logs.slice(-limit).reverse();

    let output = `# Histórico do Projeto: ${projectName}\n\n`;
    output += `Exibindo ${logs.length} registro(s) mais recente(s)\n\n`;

    const emoji = {
      sucesso: "✅",
      erro: "❌",
      atualização: "🔄",
      nota: "📝",
      alerta: "⚠️",
    };

    logs.forEach((log) => {
      const date = new Date(log.timestamp);
      output += `## ${emoji[log.type]} ${log.type.toUpperCase()} - ${date.toLocaleString()}\n`;
      output += `${log.message}\n`;
      if (log.details) {
        output += `\nDetalhes: ${log.details}\n`;
      }
      output += "\n";
    });

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MCP Project Context Server v2.0 rodando em stdio");
  }
}

const server = new ProjectContextServer();
server.run().catch(console.error);
