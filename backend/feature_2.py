# backend/feature_2.py - Assignment Breakdown

from langchain.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pydantic import BaseModel, Field
from typing import Annotated
from dotenv import load_dotenv

load_dotenv()

class AssignmentInput(BaseModel):
    assignment_text: Annotated[str, Field(..., description='The Full Assignment Description')]
    deadline_days: Annotated[int, Field(..., description='Days Until Deadline')]

@tool('breakdown_assignment', args_schema=AssignmentInput)
def breakdown_assignment(assignment_text: str, deadline_days: int) -> str:
    """
    Creates a simple breakdown of assignment tasks with a timeline.
    """
    
    model = ChatGoogleGenerativeAI(model='gemini-2.5-flash')
    
    prompt = PromptTemplate(
        template="""
Break down this assignment into a step-by-step plan:
Assignment: {assignment_text}
Deadline: {deadline_days} days from now

Provide:
1. A list of specific, actionable tasks in a logical order (e.g., "Research", "Outline", "Draft Introduction", "Draft Body Paragraphs", "Proofread").
2. A rough time estimate for each task.
3. A suggested day to complete each task, spreading the work evenly up to the deadline.

Be specific and practical.
""",
        input_variables=["assignment_text", "deadline_days"]
    )
    
    parser = StrOutputParser()
    chain = prompt | model | parser
    response = chain.invoke({"assignment_text": assignment_text, "deadline_days": deadline_days})
    
    return response