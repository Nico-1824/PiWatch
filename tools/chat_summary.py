from openai import OpenAI
import os
import dotenv

dotenv.load_dotenv()


client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)



def get_summary(chatLog):

    if len(chatLog) < 0:
        return "chatLog is empty or failed to be sent"
    


    chatString = """Summarize this text and give an overview of it to be used on a chatboard dashboard just to explain what has been talked about 
                    lately in a professial manner and proper grammer in a maximum of 50 words: \n"""
    for i in range(len(chatLog)):
        chatString += chatLog[i] + ", "

    response = client.responses.create(
        input=chatString,
        model="openai/gpt-oss-20b",
    )

    return response.output_text # the summary