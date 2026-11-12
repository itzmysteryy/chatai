const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const buttonSend = document.getElementById("send-message");

async function sendMessage() {
    const newMessage = messageInput.value.trim();
    if (!newMessage){
        return
    }
    messageInput.value = ""
    const userDiv = document.createElement("div");
    userDiv.textContent = newMessage;
    userDiv.classList.add("user-message");
    chatMessages.appendChild(userDiv);
    
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({message: newMessage})
    }
    );

    const data = await response.json();

    const aiDiv = document.createElement("div");
    aiDiv.textContent = data.reply;
    aiDiv.classList.add("ai-reply");
    chatMessages.appendChild(aiDiv);

}

buttonSend.addEventListener("click", sendMessage);