# Agentic Design Plans

This document contains plans and specifications for the agentic design of the EssayCoach platform.

## Overview

The EssayCoach system is designed as a State-Machine-Based Multi-Agent System. Unlike a linear chain, it uses a graph architecture (*LangGraph*) to manage state transitions, enabling cyclical reasoning, self-correction, and parallel execution. The core philosophy is "**Trust but Verify,**" specifically applied via a *Corrective RAG (CRAG)* subgraph that ensures every claim in a student's essay is cross-referenced against validated knowledge before feedback is generated.

## Design Principles

1. Parallelism over Sequentialism: To reduce latency, independent analysis tasks (Logic, Language, and Fact-Checking) run concurrently.

2. Cyclical Verification: The fact-checking agent does not just retrieve; it evaluates the quality of retrieval. If the local knowledge base is insufficient, it actively loops back to perform a web search, ensuring high fidelity.

3. Strict State Typing: Data passed between agents is strictly typed (using Pydantic models) to prevent hallucinated data structures and ensure reliable JSON parsing.

4. Modular Sub-Graphing: Complex workflows (like Fact-Checking) are encapsulated as "Sub-Graphs," keeping the main orchestration layer clean and readable.

## Architecture

The high-level architecture consists of a **Main Supervisor Graph** that branches into three distinct analysis nodes. One of these nodes (Fact Checker) acts as a nested state machine.

```mermaid
graph TD
    %% Styling
    classDef input fill:#f9f,stroke:#333,stroke-width:2px;
    classDef agent fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;
    classDef subagent fill:#e0f2f1,stroke:#00695c,stroke-width:2px,stroke-dasharray: 5 5;
    classDef aggregator fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;

    %% Nodes
    Start([User Input <br/> Essay + Rubric + Topic]) --> Scatter((Distribute))
    
    subgraph Parallel_Processing_Layer [Parallel Processing Layer]
        direction LR
        Scatter --> A[Language Analyst <br/> <i>Syntax & Tone</i>]
        Scatter --> B[Logic Analyst <br/> <i>Argument Flow</i>]
        Scatter --> C[Rubric Extractor <br/> <i>Criteria Parsing</i>]
        Scatter --> D[Fact Checker Subgraph <br/> <i>Corrective RAG</i>]
    end

    %% Fact Checker Internal (Simplified representation)
    D -.-> D1[Claims]
    D -.-> D2[Verification]
    
    %% Aggregation
    A --> Aggregator{Aggregator Node}
    B --> Aggregator
    C --> Aggregator
    D --> Aggregator

    Aggregator --> Final[Final Evaluation Report]

    %% Classes
    class Start input;
    class A,B,C agent;
    class D subagent;
    class Aggregator aggregator;
```

Component Breakdown
**The Supervisor (State Manager)**: Orchestrates the flow and holds the OverallState (essay content, rubrics, and final reports).

**Agent A (Fact Checker - CRAG Subgraph)**: A dedicated loop for extracting claims, retrieving evidence, and verifying accuracy.

```mermaid
flowchart TD
    %% Styling
    classDef start fill:#f9f,stroke:#333,stroke-width:2px;
    classDef action fill:#bbdefb,stroke:#1565c0,stroke-width:2px;
    classDef decision fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,shape:diamond;
    classDef tool fill:#ffccbc,stroke:#d84315,stroke-width:2px;

    %% Workflow
    Start([Input: Essay Content]) --> Extract[Extract Claims <br/> <i>JSON List</i>]
    Extract --> Retrieve[Retrieve Docs <br/> <i>Vector Store</i>]
    Retrieve --> Grade[Grade Relevance <br/> <i>LLM Evaluator</i>]
    
    Grade --> Check{Relevant?}
    
    %% The Corrective Branch
    Check -- Yes --> Generate[Verify Claim <br/> <i>Using Local Docs</i>]
    Check -- No/Ambiguous --> WebSearch[Web Search <br/> <i>Tavily API</i>]
    
    WebSearch --> Generate
    
    Generate --> Output([Output: <br/>Fact Check Report JSON])

    %% Classes
    class Start,Output start;
    class Extract,Retrieve,Grade,Generate action;
    class Check decision;
    class WebSearch tool;
```

**Agent B (Language Analyst)**: A single-shot LLM node focused on syntax, tone, and style.

**Agent C (Logic Analyst)**: A single-shot LLM node focused on argumentation flow and logical fallacies.

**Agent D (Rubric Extractor)**: A specialized tool-use agent that parses unstructured rubric text into a structured grading schema.

```mermaid
sequenceDiagram
    participant User
    participant Orch as Orchestrator (LangGraph)
    participant AC as Analysis Agents (Logic/Lang)
    participant FC as Fact Checker (CRAG)
    participant Agg as Aggregator

    User->>Orch: Submit Essay (Image/Text)
    Note right of User: Input: {essay_content, question}
    
    Orch->>Orch: Initialize OverallState
    
    par Parallel Execution
        Orch->>AC: Invoke Analysis
        AC->>AC: Analyze Logic & Syntax
        AC-->>Orch: Return Partial State {logic_report, lang_report}
    and Fact Checking
        Orch->>FC: Invoke Subgraph
        FC->>FC: Extract Claims
        loop Verification Loop
            FC->>FC: Retrieve -> Grade -> (Search) -> Verify
        end
        FC-->>Orch: Return Partial State {fact_report}
    end
    
    Orch->>Agg: Pass Full State {logic, lang, fact_report}
    Agg->>Agg: Synthesize Feedback
    Agg-->>User: Final Report (Structured JSON/Markdown)
```