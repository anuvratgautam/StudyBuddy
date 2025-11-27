# backend/agent.py

from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from typing import Dict, Any, Optional
from .feature_1 import create_study_plan
from .feature_2 import breakdown_assignment
from .feature_3 import search_documents
from .context import set_current_user

load_dotenv()

def create_student_agent():
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
    
    tools = [breakdown_assignment, create_study_plan, search_documents]
    
    system_prompt = """You are a smart and helpful student assistant.

You have access to the following tools:
1. `search_documents`: To read from the student's uploaded PDFs/notes.
2. `breakdown_assignment`: To make a timeline for tasks.
3. `create_study_plan`: To make a schedule.

CRITICAL RULES:
1. Check Documents First: If the user asks about "the project", "the document", or vague terms, USE `search_documents`.
2. Cite Sources: When answering from documents, mention the filename.
3. Be Direct: If you find the info, answer directly.
4. Avoid using characters like '*' or similar in the answer because it is breaking the output.
Always be practical and supportive."""

    return create_agent(llm, tools, system_prompt=system_prompt)

student_agent = create_student_agent()

def run_agent(user_input: str, user_id: str = "default_user") -> Dict[str, Any]:
    """
    Run the agent and return both the answer and the last tool used.
    Returns: {"answer": str, "tool_used": str | None}
    """
    # 1. Set the context for this execution
    token = set_current_user(user_id)
    
    print(f"Running agent for user {user_id} with input: {user_input}")
    
    try:
        result = student_agent.invoke({
            "messages": [{"role": "user", "content": user_input}]
        })
        
        # --- NEW LOGIC: Find the last tool used ---
        last_tool = None
        messages = result.get("messages", [])
        
        for msg in messages:
            # Check if the message is an AI message requesting a tool call
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                # tool_calls is a list of dicts, e.g. [{'name': 'search_documents', ...}]
                # We grab the name of the tool
                if len(msg.tool_calls) > 0:
                    last_tool = msg.tool_calls[-1]['name']

        # --- Standard Response Parsing ---
        final_messages = result.get("messages", [])
        if not final_messages:
            return {"answer": "Error: No response from agent.", "tool_used": None}
            
        content = final_messages[-1].content
        final_text = ""
        
        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, dict) and "text" in part:
                    text_parts.append(part["text"])
                elif isinstance(part, str):
                    text_parts.append(part)
            final_text = "".join(text_parts)
        else:
            final_text = str(content)
            
        return {
            "answer": final_text,
            "tool_used": last_tool
        }
        
    except Exception as e:
        print(f"Error running agent: {e}")
        import traceback
        traceback.print_exc()
        return {
            "answer": "An error occurred while processing your request.",
            "tool_used": None
        }