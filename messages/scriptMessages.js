const url = "https://nikitadumkin.fun/messengerServer";

let updateSystem = {
    lastDialogId: "",
    dialogsQueue: [],
    dialogCount: 0
}

function init(){ //runnnig scripts onload body

    checkForToken();

    document.querySelector("main").style.height = (window.innerHeight - 100) + "px"

    window.addEventListener("resize", (e) => {
        document.querySelector("main").style.height = (window.innerHeight - 100) + "px"
    })
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
        //document.querySelector("#userPict").src = "data:image/png;base64," + res.data.imageBlob

        if(res.data.imageBlob != "none"){
            document.querySelector("#userPict").src = "data:image/png;base64," + res.data.imageBlob
        }
        else{
            document.querySelector("#userPict").src = "../staticFiles/images.png"
        }

        document.querySelector("#userName").innerHTML = res.data.name + " " + res.data.surname
    })
}

function goToDialog(e){
    ws.close()

    const href = document.createElement("a")
    href.href = "../dialog/index.html?dialog_id=" + e.target.dataset.dialog_id
    href.click()
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
            console.log("New token")
            break;
        case "newDialog":
            getDialogs()
            break;
        case "newMessage":
            getDialogs()
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

function createNewDialog(){
    let phone = prompt("Введите номер телефона собеседника:")

    if(phone){
        phone = phone.replace(/[^0-9]/g,"")
        if(phone.length == 10){
            const reqest = new wsReques("newDialog", {members: [phone]})

            ws.send(JSON.stringify(reqest))
        }
        else{
            alert("Введите действительный номер телефона!")
        }
    }
}

class wsReques{
    constructor(route, payload){
        this.route = route
        this.payload = payload
    }
}

//Dialogs rendering

function onGetDialogs(payload){

    console.log(payload);

    updateSystem.lastDialogId = payload[payload.length-1]?.dialog_id
    updateSystem.dialogsQueue = []
    updateSystem.dialogCount = payload.length

    if(payload.length > 0){
        payload.forEach((dialog) => {
            renderNewDialog(dialog)
        })
    }
    else{
        document.querySelector("#dialogContainer").innerHTML = "<div style='margin: 10px; margin-top: 30px; text-align: center;'><h1>Диалогов нет ;(<h1><h3 style='margin-top: 20px;'>Но вы всегда можете добавить их, нажав на плюс!<h3><div>"
    }
}

function renderNewDialog(dialog){

    const newDialog = document.createElement("div")
    newDialog.classList.add("dialog")
    newDialog.dataset.dialog_id = dialog.dialog_id
    newDialog.dataset.lastMessageTime = dialog.lastMessageTime
    newDialog.onclick = goToDialog


    const img = document.createElement("img")
    img.dataset.dialog_id = dialog.dialog_id
    
    newDialog.append(img)

    const textContainer = document.createElement("div")
    textContainer.classList.add("textContainer")
    textContainer.dataset.dialog_id = dialog.dialog_id

    const dialogName = document.createElement("p")
    dialogName.classList.add("dialogName")
    dialogName.dataset.dialog_id = dialog.dialog_id

    const dialogText = document.createElement("p")
    dialogText.classList.add("dialogText")
    dialogText.dataset.dialog_id = dialog.dialog_id

    const tempMessagesArray = Object.values(dialog.messages)

    if(tempMessagesArray.length > 0){
        dialogText.innerHTML = tempMessagesArray[tempMessagesArray.length - 1]?.message_text
        if(tempMessagesArray[tempMessagesArray.length - 1].user_id == localStorage.getItem('phone'))
        dialogText.innerHTML = "Вы: " + tempMessagesArray[tempMessagesArray.length - 1]?.message_text
    }
    else{
        dialogText.innerHTML = "Новый диалог создан"
    }

    textContainer.append(dialogName)
    textContainer.append(dialogText)

    newDialog.append(textContainer)

    const dialogTime = document.createElement("p")
    dialogTime.classList.add("dialogTime")
    dialogTime.dataset.dialog_id = dialog.dialog_id

    let date = new Date(dialog.lastMessageTime)
    let currentDate = Date().split(" ")

    if(date.toString().split(" ")[0] == currentDate[0]){
        dialogTime.innerHTML = date.toString().split(" ")[4].slice(0, -3)
    }
    else{
        dialogTime.innerHTML = date.getDate().toString()+ "/" + (date.getMonth()+1)
        console.log(date.toString())
    }
    newDialog.append(dialogTime)

    dialog.members.forEach(phone => {
        if(phone != localStorage.getItem("phone")){
            fetchDialogUserData(phone, newDialog)
        }
    })
}

function fetchDialogUserData(phone, newDialog){
    const token = localStorage.getItem("token");
    fetch(url+ "/api/userData?phone=" + phone,{
        headers: {
            Authorization: "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(({data}) => {
        console.log(newDialog)

        if(data.imageBlob != "none"){
            newDialog.querySelector("img").src = "data:image/png;base64," + data.imageBlob
        }
        else{
            newDialog.querySelector("img").src = "../staticFiles/images.png"
        }
        newDialog.querySelector(".dialogName").innerHTML = data.name + " " + data.surname

        updateSystem.dialogsQueue.push(newDialog)
        if(newDialog.dataset.dialog_id == updateSystem.lastDialogId){

            const interval = setInterval(() => {
                if(updateSystem.dialogCount == updateSystem.dialogsQueue.length){
                    clearInterval(interval)
                    document.querySelector("#dialogContainer").innerHTML = ""

                    updateSystem.dialogsQueue.sort((a, b) => {
                        console.log("sorting");
                        console.log(a.dataset.lastMessageTime);
                        return +b.dataset.lastMessageTime - +a.dataset.lastMessageTime 
                    })

                    updateSystem.dialogsQueue.forEach(dialog=>{
                        document.querySelector("#dialogContainer").append(dialog)
                    })
                }
                else{
                    console.log(updateSystem.dialogsQueue.length);
                }
            }, 50)
        }
    })
}