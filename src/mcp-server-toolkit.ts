import { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { BaseToolkit, StructuredTool, StructuredToolInterface, tool } from "@langchain/core/tools";
import { Tool as MCPTool } from "@modelcontextprotocol/sdk/types";
import jsonSchemaToZod, { JsonSchema } from "json-schema-to-zod";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport";

/**
 * Represents a connection to an MCP (Model Context Protocol) server.
 * It includes a client for communication and a transport method for connectivity.
 */
export interface MCPServerConnection {
    /**
     * The client used to interact with the MCP server.
     */
    client: Client;

    /**
     * The transport mechanism used for the connection.
     */
    transport: Transport;
}

/**
 * Toolkit responsible for converting MCP (Model Context Protocol) tools 
 * into LangChain compatible tools. It allows interaction with MCP servers by establishing 
 * a connection for each one using a client and a transport method.
 */
export class MCPServerToolkit extends BaseToolkit {
    tools: StructuredToolInterface[];

    constructor() {
        super();
        this.tools = [];
    }

    /**
     * Connects to provided MCP servers and retrieves tools from each one.
     * @param connections - The MCP server connections to establish.
     * @returns A promise that resolves when all tools have been added.
     */
    async addTools(...connections: MCPServerConnection[]) {
        return Promise.all(connections.map(connection => this.addServerTools(connection)));
    }

    private async addServerTools(connection: MCPServerConnection) {
        await connection.client.connect(connection.transport);

        let result = await connection.client.listTools();

        this.tools.push(...result.tools.map(tool => this.mcpToolToLangchain(connection.client, tool)));
    }

    private mcpToolToLangchain(client: Client, mcpTool: MCPTool): StructuredTool {
        const zodSchema = jsonSchemaToZod(mcpTool.inputSchema as JsonSchema, { module: "cjs" });
        const schema = eval(zodSchema);

        return tool(
            async input => {
                return client.callTool({
                    name: mcpTool.name,
                    arguments: input
                });
            },
            {
                name: mcpTool.name,
                description: mcpTool.description,
                schema: schema
            }
        );
    }
}
