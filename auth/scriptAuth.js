const url = "https://nikitadumkin.fun/messengerServer";

function init(){ //runnnig scripts onload body
    checkForToken();

    form.addEventListener('submit', preSend)
}

function checkForToken(){ //Проверка наличия jwt в localStorage
    const token = localStorage.getItem("token");

    if(token){
        checkJWT(token)
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
            const href = document.createElement("a")
            href.href = "../messages/index.html"
            href.click()
        }
        else{ //если токен недействителен, то он удаляется из хранилища
            localStorage.clear()
        }
    })
}



function preSend(e){
    e.preventDefault()
    const phoneInput = document.querySelector("#phoneInput")
    const passwordInput = document.querySelector("#passwordInput")

    phoneInput.style.border = "none"
    passwordInput.style.border = "none"

    const phone = phoneInput.value
    const password = passwordInput.value

    if(phone.length == 10 && phone[0] == "9" && password != ""){
        sendData(phone, password)
        return
    }
    
    if(phone.length != 10 || phone[0] != "9"){
        phoneInput.style.border = "2px red solid"
    }

    if(password == ""){
        passwordInput.style.border = "2px red solid"
    }

}

function sendData(phone, password){
    
    console.log(password);

    fetch(url+"/auth/login", {
        method: "POST",
        body: JSON.stringify({
            "phone": phone,
            "password": password
        }),
        headers:{
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin" : "*"
        }
    })
    .then(res => {
        if(res.status < 400 && res.status > 199){
            res.json().then(res => {
                localStorage.setItem("token", res.token)
                localStorage.setItem("phone", phone)

                const href = document.createElement("a")
                href.href = "../messages/index.html"
                href.click()

            })
        }
        else{
            document.querySelector("#phoneInput").style.border = "2px red solid"
            document.querySelector("#phoneInput").value = ""
            document.querySelector("#passwordInput").style.border = "2px red solid"
            document.querySelector("#passwordInput").value = ""
        }
    })
}

function phoneHandler(){
    const phoneInput = document.querySelector("#phoneInput")
    phoneInput.value = String(phoneInput.value).replace(/[^0-9]/, "")
}