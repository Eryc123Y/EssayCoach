# Workflow Orchestration

This document contains plans and specifications for workflow orchestration in the EssayCoach platform.

## Overview

Orchestration is handled by a *StateGraph*. The workflow begins with a **Parallel Scatter**, splitting the execution into three simultaneous threads. The most complex thread, the Fact Checker, operates strictly as a *Corrective Retrieval Augmented Generation (CRAG)* workflow.

## Orchestration Patterns

**Pattern A: The Parallel Scatter-Gather**
This pattern is used for the main analysis.

**Scatter**: Upon receiving the *OverallState*, the graph triggers *FactNode, LogicNode*, and *LanguageNode* simultaneously.

**Gather**: The *AggregatorNode* waits for all three outputs to populate in the state before synthesizing the final feedback.

**Pattern B: The Corrective RAG Loop (The Sub-Graph)**
This pattern is specific to the Fact Checker agent.

**Retrieve:** Query Local Knowledge Base (Vector Store).

**Grade:** An LLM "Grader" evaluates document relevance.

**Branch (Conditional Edge):**

*If Relevant:* Proceed to Verification.

*If Irrelevant:* Trigger WebSearchNode, then loop back to Verification.

**Verify:** Compare Claim vs. Evidence.

## Implementation Details

### The "State" (Data Schema)

In LangGraph, the "State" is the data structure passed between agents. We need a Global State for the main graph and a Sub-State for the Fact Checker.

### A. Global State (`OverallState`)

```python
from typing import TypedDict, List, Optional

class OverallState(TypedDict):
    # Inputs
    essay_content: str  # Or list of image URLs/base64
    essay_question: str
    
    # Outputs from Parallel Agents
    fact_check_report: dict  # JSON output from Agent 1
    language_analysis: str   # Report from Agent 2
    logic_analysis: str      # Report from Agent 3
    rubric_criteria: dict    # Extracted rubric from Agent 4
    
    # Final Output
    final_evaluation: str
```

### B. Fact Checker Sub-State (`FactState`)

```python
class FactState(TypedDict):
    claims: List[str]        # Extracted claims
    verification_results: List[dict] # {claim: str, status: "verified/refuted", source: str}
    documents: List[str]     # Retrieved chunks from local KB
    web_search_needed: bool  # Decision flag
```

-----

### Component Breakdown (The Parallel Agents)

#### Branch 1: Sequential Agent Fact Checker (The Sub-Graph)

*This is the most complex component. We implement this as a compiled LangGraph `StateGraph`.*

**Workflow:** `Claim Extraction` -\> `Corrective Verification (CRAG)` -\> `Report Generation`

#### **Step 1: Fact Retriever (Agent 1)**

  * **Function:** Parses the essay and extracts distinct, verifiable claims.
  * **Tool/Method:** LLM with **Structured Output** (Pydantic model).
  * **Library:** `ChatOpenAI.with_structured_output(ClaimsSchema)`

#### **Step 2: Verification Agent (Agent 2 - Corrective RAG)**

  * **Concept:** This implements the CRAG logic.
  * **Logic Flow:**
    1.  **Retrieve:** Query the `Local Knowledge Base` (Vector Store containing Research Papers/Wikipedia).
    2.  **Grade:** LLM evaluates if retrieved documents are relevant to the claims.
    3.  **Decide:**
          * *If Relevant:* Proceed to verify.
          * *If Irrelevant/Ambiguous:* Trigger **Web Search Tool** (e.g., Tavily API).
    4.  **Verify:** Compare Claim vs. Evidence (Local or Web).

#### **Step 3: Generation Agent (Agent 3)**

  * **Function:** Compiles the verification results into a JSON report.
  * **Output:** `{"claim": "...", "verdict": "True/False", "evidence": "..."}`

-----

#### Branch 2: LLM Language Analyst

  * **Function:** Checks grammar, tone, vocabulary, and style.
  * **Configuration:** A standard LLM node.
  * **Prompt:** "Act as a strict editor. Analyze the following essay for [specific linguistic metrics]..."

#### Branch 3: LLM Logic Analyst

  * **Function:** Checks coherence, flow of arguments, and logical fallacies.
  * **Configuration:** A standard LLM node.
  * **Prompt:** "Analyze the logical flow. Are the arguments sound? Identify any non-sequiturs or strawman arguments."

#### Branch 4: LLM Rubric Extractor

  * **Function:** specific extraction of the grading criteria.
  * **Input:** The raw rubric text/image.
  * **Configuration:** LLM with **Structured Output**.
  * **Library:** `ChatOpenAI.with_structured_output(RubricSchema)`.

-----

### Implementation Skeleton (Pseudo-Code)

This is how we stitch it together using **LangGraph**.

```python
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI

# 1. Define the Sub-Graph (Fact Checker)
def extract_claims(state):
    # Call LLM to get JSON claims
    return {"claims": extracted_claims}

def verify_claims(state):
    # CRAG Logic: Retrieve -> Grade -> (Search if needed) -> Verify
    # Returns verification_results
    return {"verification_results": results}

def generate_fact_report(state):
    # Formats the final JSON
    return {"fact_check_report": final_json}

fact_graph = StateGraph(FactState)
fact_graph.add_node("extract", extract_claims)
fact_graph.add_node("verify", verify_claims)
fact_graph.add_node("report", generate_fact_report)

fact_graph.add_edge(START, "extract")
fact_graph.add_edge("extract", "verify")
fact_graph.add_edge("verify", "report")
fact_graph.add_edge("report", END)

# Compile the sub-graph
fact_checker_app = fact_graph.compile()

# ---------------------------------------------------------

# 2. Define Main Parallel Nodes
def run_fact_checker_subgraph(state):
    # Input transformation: Map Global State to Sub-State
    sub_inputs = {"claims": [], "documents": []} # logic to init sub-state
    result = fact_checker_app.invoke(sub_inputs)
    return {"fact_check_report": result["fact_check_report"]}

def language_analyst(state):
    # LLM call
    return {"language_analysis": result}

def logic_analyst(state):
    # LLM call
    return {"logic_analysis": result}

def rubric_extractor(state):
    # LLM call
    return {"rubric_criteria": result}

def aggregator(state):
    # Combine all 4 outputs into one final summary
    return {"final_evaluation": combined_report}

# 3. Define Main Graph
workflow = StateGraph(OverallState)

# Add Nodes
workflow.add_node("fact_checker", run_fact_checker_subgraph)
workflow.add_node("language_analyst", language_analyst)
workflow.add_node("logic_analyst", logic_analyst)
workflow.add_node("rubric_extractor", rubric_extractor)
workflow.add_node("aggregator", aggregator)

# Create Parallel Branching
# All 4 nodes start immediately from START
workflow.add_edge(START, "fact_checker")
workflow.add_edge(START, "language_analyst")
workflow.add_edge(START, "logic_analyst")
workflow.add_edge(START, "rubric_extractor")

# Converge all to Aggregator
workflow.add_edge("fact_checker", "aggregator")
workflow.add_edge("language_analyst", "aggregator")
workflow.add_edge("logic_analyst", "aggregator")
workflow.add_edge("rubric_extractor", "aggregator")

workflow.add_edge("aggregator", END)

# Compile
app = workflow.compile()
```




