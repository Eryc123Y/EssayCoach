# Technique Stacks

This document contains plans and specifications for the choice of technique stacks in the EssayCoach platform.

## Overview

The stack is chosen to optimize for **orchestration control** (*LangGraph*) and **structured data reliability** (*Pydantic/LangChain*). We prioritize explicit control flows over "black box" agent automations to ensure the grading logic is deterministic and traceable.

## Stack Selection


| Layer | Selection | Technology | Reasoning |
|------|-----------|------------|-----------|
| Orchestration | LangGraph | LangGraph | Essential for cyclical flows (CRAG) and parallel execution which standard LangChain Chains cannot handle efficiently. |
| Agent Logic | LangChain Core | LangChain Core | Provides the standard interface for PromptTemplates and Runnables. |
| Model Interface | LangChain OpenAI | GPT-4o | Utilizes GPT-4o for its multimodal capabilities (handling image-based essays/rubrics). |
| Data Validation | Pydantic | Pydantic | Enforces rigid JSON schemas for Agent outputs (e.g., ensuring the Fact Checker always returns a list of objects). |
| Vector Store | LangChain Chroma | Chroma | A lightweight, local-first vector store for the "Local Knowledge Base" (Research Papers). |
| Search Tool | Tavily API | Tavily | A search API specifically optimized for LLM agents (returns clean text chunks rather than raw HTML). |

## Technology Decisions

1. ### Vision-First Input Processing
Instead of using OCR (Tesseract) which loses formatting context, we will use GPT-4o's native vision capabilities via langchain-openai.

Implementation: Pass base64 encoded images of the essay/rubric directly to the Rubric Extractor and Claim Extractor nodes.

2. ### Structured Output Parsing
We strictly avoid loose text responses for internal node communication.

Implementation: All analysis nodes utilize .with_structured_output(SchemaModel) to guarantee that the "Aggregator" node receives parseable JSON, not natural language chatter.