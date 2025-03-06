# LangChain MCP Integration [![npm version](https://img.shields.io/npm/v/%40lambdaworks%2Flangchain-mcp-integration)](https://www.npmjs.com/package/@lambdaworks/langchain-mcp-integration) [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Overview

The [Model Context Protocol](https://modelcontextprotocol.io/introduction) allows applications to provide context for LLMs in a standardized way, separating the concerns of providing context from the actual LLM interaction. There are plenty of open source MCP servers available, each one offering different tools for an LLM to use, but they're not compatible with LangChain's tool representation out of the box. This library provides a thin wrapper around the interaction with MCP servers, ensuring they're compatible with LangChain.

## Installation

```
npm i @lambdaworks/langchain-mcp-integration
```

## Usage

An example of how this library allows you to use MCP tools with a prebuilt ReAct agent from LangGraph:

```
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { MCPServerToolkit } from "@lambdaworks/langchain-mcp-integration";

const client = new Client({
    name: "example-client",
    version: "1.0.0"
});

const transport = new StdioClientTransport({
    command: "uvx",
    args: ["mcp-server-fetch", "--ignore-robots-txt"]
});

let toolkit = new MCPServerToolkit();

await toolkit.addTools({ client, transport });

const agentModel = new ChatOpenAI({ temperature: 0 });

const agent = createReactAgent({
    llm: agentModel,
    tools: toolkit.getTools()
});

const agentFinalState = await agent.invoke({ 
    messages: [new HumanMessage("Summarize the information from this URL: https://rs.linkedin.com/company/lambdaworksio")] 
});

console.log(
    agentFinalState.messages[agentFinalState.messages.length - 1].content
);
```

You can also add tools from multiple MCP servers:

```
toolkit.addTools({ client: client1, transport: transport1 }, {client: client2, transport: transport2 });
```

Each client and transport pair are used to specify the way you'll connect to a specific MCP server.
