# backend/feature_1.py - Study Planner

from langchain.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate # <-- Fixed typo: PomptTemplate -> PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pydantic import BaseModel, Field
from typing import Annotated
from dotenv import load_dotenv

load_dotenv()

class StudyInput(BaseModel):
    topics: Annotated[str, Field(..., description="The topics to study, comma-separated")]
    hours_available: Annotated[int, Field(..., description="Total hours available")]

@tool("create_study_plan", args_schema=StudyInput)
def create_study_plan(topics: str, hours_available: int) -> str:
    """
    Creates a detailed personal study plan, including breaks,
    using the Pomodoro technique.
    """
    model = ChatGoogleGenerativeAI(model='gemini-2.5-flash')

    prompt = PromptTemplate(
        template="""
Create a detailed study plan:
Topics: {topics}
Available time: {hours_available} hours
Include:
- Time blocks for each topic
- 10-minute breaks every hour
- A mix of focused study and practical exercises
- Short quizzes or review periods to test understanding
- Use the Pomodoro technique (25 min study, 5 min break) where appropriate.

Make the plan encouraging and practical.
""",
        input_variables=["topics", "hours_available"]
    )

    parser = StrOutputParser()
    chain = prompt | model | parser
    response = chain.invoke({"topics": topics, "hours_available": hours_available})
    
    return response