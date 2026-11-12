import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import Groq from "groq-sdk";


if (!process.env.GROQ_API_KEY) {
    console.log('No API key found, please add API key first in .env');
    process.exit(1);
}
else {
    console.log('GROQ_API_KEY loaded:', !!process.env.GROQ_API_KEY);
}


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });



const app = express();

app.use(express.static('public')); //allow if any request comes from public folder
app.use(cors());
app.use(express.json());


app.get('/health', (req,res) => {
    res.send("Health ok, Im alive");
    
} );

app.get('/api/joke', (req,res) => {
    res.send("You are the joke");
})

app.post('/api/chat', async (req,res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '' ){
        return res.status(400).json({
            error: "Message must be a non-empty string"
        }
    );
    
    }
    // return res.json({reply: `You said: ${message}`});
    try{
        const messages = [
            {
                role: "user",
                content: message.trim()
            }
        ]
        const result = await groq.chat.completions.create({ model: "openai/gpt-oss-120b", messages});
        res.json({reply: result.choices[0].message.content});
    }
    catch (error){
        console.error(error);
        res.status(500).json({error: "Failed to get response"});
    }

});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Serving at http://localhost:${port}`);
});