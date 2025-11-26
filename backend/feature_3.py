# backend/feature_3.py

from langchain.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pydantic import BaseModel, Field
from typing import Annotated
from dotenv import load_dotenv
from .pdf_handler import search_similar_documents, format_context_from_docs
from .context import get_current_user # <-- Import context getter

load_dotenv()

class DocumentSearchInput(BaseModel):
    query: Annotated[str, Field(..., description="The question to search in uploaded documents")]

@tool("search_documents", args_schema=DocumentSearchInput)
def search_documents(query: str) -> str:
    """
    Search through uploaded documents to answer a specific question.
    """
    # 1. Get the current user_id from context
    user_id = get_current_user()
    print(f"Tool executing for user: {user_id}")

    # 2. Pass user_id to the search function
    docs = search_similar_documents(query, user_id)
    
    if not docs:
        return "No relevant documents were found. Please make sure you have uploaded PDFs."
        
    context = format_context_from_docs(docs)
    
    model = ChatGoogleGenerativeAI(model='gemini-2.5-flash')
    
    prompt = PromptTemplate(
        template="""
Answer the following question based *only* on the document excerpts provided below:

{context}

Question: {query}

Instructions:
- Base your answer strictly on the text provided.
- Cite the filename and page number using double braces like {{filename}} and {{page}}.
- If the answer is not in the context, say so.
""",
        input_variables=["context", "query"]
    )
    
    parser = StrOutputParser()
    chain = prompt | model | parser
    response = chain.invoke({"context": context, "query": query})
    
    return response