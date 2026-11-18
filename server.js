import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import Groq from "groq-sdk";
import fs from 'node:fs';


const instructions = fs.readFileSync('instructions.md','utf-8');

if (!process.env.GROQ_API_KEY) {
    console.log('No API key found, add API key first in .env');
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
});

app.post('/api/login', (req, res) =>{
    const {password} = req.body;
    if (password === process.env.APP_PASSWORD){
        res.json({success: true});
    }
    else{
        res.status(401).json({error: "Wrong password"});
    }
}); 

app.post('/api/chat', async (req,res) => {
    const {messages, password} = req.body;
    if (password !== process.env.APP_PASSWORD){
        return res.status(401).json({error: "Wrong password, access denied"});
    }

    if (!messages || !Array.isArray(messages)|| messages.length < 1){
        return res.status(400).json({
            error: "Message must be a non-empty string"
        }
    );
    
    
    }

    messages.unshift({role: "system", content: instructions}); // read the intrucstion file
    
    // return res.json({reply: `You said: ${message}`});
    try{
        const result = await groq.chat.completions.create({ model: "openai/gpt-oss-20b", messages});
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