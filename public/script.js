let storedPassword = "";
let conversationHistory = [];



const loginSection = document.getElementById("login-section");
const chatSection = document.getElementById("chat-section")
const userPassword = document.getElementById("password-input");
const passwordSend = document.getElementById("login-button");

const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const buttonSend = document.getElementById("send-message");

async function checkPassword() {
    const enteredPassword = userPassword.value.trim();
    if(!enteredPassword){
        return
    }
    userPassword.value = "";
    const response = await fetch("/api/login", {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({password: enteredPassword})
    });
    const pass = await response.json() 
    if (response.ok) {
        storedPassword = enteredPassword;
        loginSection.style.display = "none";
        chatSection.style.display = "block"
    }
    else{
        alert("Wrong password, access denied!");
    }
}

async function sendMessage() {
    buttonSend.disabled = true;
    buttonSend.textContent = "...";
    const newMessage = messageInput.value.trim();
    if (!newMessage){
        return
    }
    messageInput.value = "";
    const userDiv = document.createElement("div");
    userDiv.textContent = newMessage;
    userDiv.classList.add("user-message");
    chatMessages.appendChild(userDiv);
    conversationHistory.push({
        role: "user", 
        content: (newMessage)}); //push into context array - imp*

    const response = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({messages: conversationHistory, password: storedPassword})
    }
    );

    const data = await response.json();

    if(!response.ok){
        alert(data.error || "Something went wrong.");
        return;
    }

    const aiDiv = document.createElement("div");

    let formattedReply = data.reply.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    formattedReply = formattedReply.replace(/\n/g, "<br>");

    aiDiv.innerHTML = formattedReply; 
    aiDiv.classList.add("ai-reply");
    chatMessages.appendChild(aiDiv);

    
    conversationHistory.push({
        role: "assistant", 
        content: (data.reply)});

    
    buttonSend.disabled = false;
    buttonSend.textContent = "Send";

}

//enter key press ke functions:
document.querySelector('#message-input').addEventListener("keypress", function(e){
    if (e.key == "Enter"){
            sendMessage();
    }
});

document.querySelector('#password-input').addEventListener("keypress", function(e){
    if (e.key == "Enter"){
            checkPassword();
    }
});

buttonSend.addEventListener("click", sendMessage);
passwordSend.addEventListener("click", checkPassword);