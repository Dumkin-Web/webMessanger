let currentDialogId = ""
const url = "https://nikitadumkin.fun/messengerServer";
const month = ["января", "февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря",]


function init(){ //runnnig scripts onload body
    readReq();
    checkForToken();

    document.querySelector("form").addEventListener("submit", sendMessage)
    document.querySelector("main").style.height = (window.innerHeight - 100) + "px"
    document.querySelector("#onemoreContainer").style.height = (window.innerHeight - 104 - 54 - 74) + "px"
    document.querySelector("#dialogContainer").style.paddingTop = (window.innerHeight - 104 - 54 - 74) + "px"
    document.querySelector("textarea").addEventListener("keypress", (e) => {
        if(e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            const messageText = document.querySelector("#message").value
            if(messageText == ""){
                document.querySelector("#message").focus()
            }
            else{
                const request = {
                    route: "newMessage",
                    payload: {
                        dialog_id: currentDialogId, 
                        user_id: localStorage.getItem("phone"), 
                        message_text: messageText
                    }
                }

                ws.send(JSON.stringify(request))

                document.querySelector("#message").value = ""
            }
        }
    })

    window.addEventListener("resize", (e) => {
        document.querySelector("main").style.height = (window.innerHeight - 100) + "px"
        document.querySelector("#onemoreContainer").style.height = (window.innerHeight - 104 - 104 - document.getElementsByTagName("textarea")[0].style.height.slice(0, -2)) + "px"
    })

    const tx = document.getElementsByTagName("textarea");
    for (let i = 0; i < tx.length; i++) {
        tx[i].setAttribute("style", "height:" + 24 + "px;overflow-y:hidden;");
        tx[i].addEventListener("input", OnInput, false);
    }

}

function OnInput() {
    if(this.scrollHeight - 10 < 227){
        this.style.height = 0;
        this.style.height = (this.scrollHeight - 10) + "px";
    }
    else{
        this.setAttribute("style", "overflow-y:scroll;");
        this.style.height = "226px";
    }

    document.querySelector("#onemoreContainer").style.height = (window.innerHeight - 104 - 54 - this.style.height.slice(0,-2) - 50) + "px"
}

function goBack(){
    const href = document.createElement("a")
    href.href = "../messages/index.html"
    href.click()
}

function readReq(){ //getting url params
    const queryRaw = window.location.search;
    const urlParams = new URLSearchParams(queryRaw);
    currentDialogId = urlParams.get("dialog_id")

    if(!currentDialogId){
        history.back()
    }
}

function checkForToken(){ //Проверка наличия jwt в localStorage
    const token = localStorage.getItem("token");

    if(token){
        checkJWT(token)
    }
    else{
        const href = document.createElement("a")
        href.href = "../auth/index.html"
        href.click()
    }

}

function checkJWT(token){ //проверка JWT на действительность

    fetch(url+"/auth/verifyJWT", {
        headers: {
            Authorization: "Bearer " + token
        }
    })
    .then(res => {
        if(res.status > 199 && res.status < 400){
            //load userdata and connect socket
            fetchUserData()
        }
        else{ //если токен недействителен, то он удаляется из хранилища
            localStorage.clear()

            const href = document.createElement("a")
            href.href = "../auth/index.html"
            href.click()
        }
    })
}

function fetchUserData(){
    const phone = localStorage.getItem("phone");
    const token = localStorage.getItem("token");

    document.querySelector("#userPhoneForRedirection").href = "../user/index.html?user_phone="+phone;

    fetch(url+ "/api/userData?phone=" + phone,{
        headers: {
            Authorization: "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(res => {
        
        if(res.data.imageBlob != "none"){
            document.querySelector("#userPict").src = "data:image/png;base64," + res.data.imageBlob
        }
        else{
            document.querySelector("#userPict").src = "../staticFiles/images.png"
        }

        document.querySelector("#userName").innerHTML = res.data.name + " " + res.data.surname
    })
}

function logout(){
    localStorage.clear()
    location.reload()
}

//WEB SOCKET//

let ws = new WebSocket("wss://nikitadumkin.fun/messengerServer/?token=" + localStorage.getItem("token"));

ws.onopen = function(e){
    console.log("WS open")
    getDialogs()
}

ws.onclose = function(e){
    console.log(e);
}

ws.onerror = function(e){
    
}

ws.onmessage = function(e){

    const data = JSON.parse(e.data)

    switch(data.route){
        case "getDialogs":
            onGetDialogs(data.payload)
            break;
        case "newJwt":
            localStorage.setItem("token", data.payload)
            break;
        case "newMessage":
            //console.log(data.payload);
            if(data.payload.dialog.dialog_id == currentDialogId){
                renderNewMessage(data.payload.newMessage)
            }
            break;
        default:
            console.log(e)
            break;
    }
}

function getDialogs(){

    const request = new wsReques("getDialogs", {})

    ws.send(JSON.stringify(request))
}

class wsReques{
    constructor(route, payload){
        this.route = route
        this.payload = payload
    }
}

function sendMessage(e){
    e.preventDefault()
    const messageText = document.querySelector("#message").value
    if(messageText == ""){
        document.querySelector("#message").focus()
    }
    else{
        const request = {
            route: "newMessage",
            payload: {
                dialog_id: currentDialogId, 
                user_id: localStorage.getItem("phone"), 
                message_text: messageText
            }
        }

        ws.send(JSON.stringify(request))

        document.querySelector("#message").value = ""
    }

}

//Dialog rendering

function onGetDialogs(payload){

    console.log(payload);
    let tempDialog = {}

    payload.forEach((dialog) => {
        if(dialog.dialog_id == currentDialogId){
            tempDialog = dialog
        }
    })

    tempDialog.members.forEach(member => {
        if(member != localStorage.getItem("phone")){
            fetchDialogUserData(member)
        }
    })

    let lastMessageTime = {
        day: -1,
        month: -1
    }
    Object.values(tempDialog.messages).forEach(message => {
        const time = new Date(message.time)
        if(lastMessageTime.day != time.getDate() || lastMessageTime.month != time.getMonth()){
            renderSplitText(time)
            lastMessageTime.day = time.getDate()
            lastMessageTime.month = time.getMonth()
        }
        renderNewMessage(message)
    })
}

function renderSplitText(date){
    const div = document.createElement("div")
    div.innerHTML = date.getDate().toString() + " " + month[date.getMonth()]
    div.classList.add("dateSplitter")
    document.querySelector("#dialogContainer").append(div)
}

function renderNewMessage(message){

    // <div class="message right">
    //                     <div class="">
    //                         hi
    //                     </div>
    // </div>

    const messageOuter = document.createElement("div")
    messageOuter.classList.add("message")
    if(message.user_id == localStorage.getItem("phone")){
        messageOuter.classList.add("right")
    }
    else{
        messageOuter.classList.add("left")
    }

    const messageInner = document.createElement("div")
    messageInner.innerHTML = message.message_text

    const messageTime = document.createElement("p")
    messageTime.classList.add("messageTime")

    let date = new Date(message.time)
    messageTime.innerHTML = date.toString().split(" ")[4].slice(0, -3)

    messageInner.append(messageTime)
    messageOuter.append(messageInner)

    document.querySelector("#dialogContainer").append(messageOuter)

    const scrollParam = document.querySelector("#dialogContainer").getBoundingClientRect().top + document.querySelector("#dialogContainer").getBoundingClientRect().height  
    document.querySelector("#onemoreContainer").scroll(0, scrollParam+500)
}

async function fetchDialogUserData(phone){
    const token = localStorage.getItem("token");

    document.querySelector("#randomId").href = "../user/index.html?user_phone="+phone;

    fetch(url+ "/api/userData?phone=" + phone,{
        headers: {
            Authorization: "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(({data}) => {
        //document.querySelector("#dialogHeader img").src = "data:image/png;base64," + data.imageBlob

        if(data.imageBlob != "none"){
            document.querySelector("#dialogHeader img").src = "data:image/png;base64," + data.imageBlob
        }
        else{
            document.querySelector("#dialogHeader img").src = "../staticFiles/images.png"
        }

        document.querySelector("#dialogHeader p").innerHTML = data.name + " " + data.surname
    })
}