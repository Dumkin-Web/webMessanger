const url = "https://nikitadumkin.fun/messengerServer";

function init(){ //runnnig scripts onload body
    checkForToken()

    document.querySelector("form").addEventListener("submit", preSend)
    document.querySelector("input[name=phone]").addEventListener('input', phoneHandler)
    document.querySelector("input[name=name]").addEventListener('input', nameAndSurnameHandler)
    document.querySelector("input[name=surname]").addEventListener('input', nameAndSurnameHandler)
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
            localStorage.removeItem("token")
        }
    })
}

function pictUpload(){
    pictUploadButton.click()
}

function onUploadPicture(){
    const reader = new FileReader()

    reader.addEventListener("load", () => {
        document.querySelector("#image").src = reader.result
    })

    reader.readAsDataURL(pictUploadButton.files[0])

    document.querySelector("#plus").style.display = "none"
}

function phoneHandler(e){
    e.target.value = String(e.target.value).replace(/[^0-9]/, "")
}

function nameAndSurnameHandler(e){
    e.target.value = String(e.target.value).replace(/[^A-zА-я]/, "")
}

function preSend(e){
    e.preventDefault();
    const form = document.querySelector("form")

    form.querySelectorAll("input").forEach(input => {
        input.style.borderColor = "white"
    })
    document.querySelector("#image").style.border = "2px white solid"

    let phone, name, surname, password, passwordRepeat, imageBlob;
    let formHasEmptyInput = false
    const formData = new FormData(form)
    
    phone = formData.get("phone")
    if(phone.length != 10){
        formHasEmptyInput = true
        form.querySelector("input[name=phone]").style.border = "2px red solid"
    }

    name = formData.get("name")
    if(!name){
        formHasEmptyInput = true
        form.querySelector("input[name=name]").style.border = "2px red solid"
    }

    surname = formData.get("surname")
    if(!surname){
        formHasEmptyInput = true
        form.querySelector("input[name=surname]").style.border = "2px red solid"
    }
    
    password = formData.get("password")
    if(!password){
        formHasEmptyInput = true
        form.querySelector("input[name=password]").style.border = "2px red solid"
    }

    passwordRepeat = formData.get("passwordRepeat")
    if(!passwordRepeat){
        formHasEmptyInput = true
        form.querySelector("input[name=passwordRepeat]").style.border = "2px red solid"
    }

    if(password != passwordRepeat && password && passwordRepeat){
        formHasEmptyInput = true
        form.querySelector("input[name=password]").style.border = "2px red solid"
        form.querySelector("input[name=password]").value = ""
        form.querySelector("input[name=passwordRepeat]").style.border = "2px red solid"
        form.querySelector("input[name=passwordRepeat]").value = ""
    }

    imageBlob = formData.get("imageBlob")
    console.log(imageBlob);
    if(imageBlob.name != ""){
        getBase64(imageBlob)
        .then(base64 => {
            imageBlob = base64.split(",")[1]

            if(!formHasEmptyInput){
                sendData(phone, name, surname, password, imageBlob)
            }
        })
        .catch(e => {
            formHasEmptyInput = true
            document.querySelector("#image").style.border = "2px red solid"
        })
    }
    else{
        formHasEmptyInput = true
        document.querySelector("#image").style.border = "2px red solid"
    }

}

function sendData(phone, name, surname, password, imageBlob){
    const request = {
        phone, name, surname, password, "imageBASE64":imageBlob,
        username: "none"
    }

    fetch(url+"/auth/reg", {
        method: "POST",
        body: JSON.stringify(request),
        headers:{
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin" : "*"
        }
    })
    .then(res => {
        if(res.status < 400){
            res.json().then(res => {
                localStorage.setItem("token", res.token)
                localStorage.setItem("phone", phone)

                const href = document.createElement("a")
                href.href = "../messages/index.html"
                href.click()

            })
        }
        else{
            document.querySelectorAll("input").forEach(input => {
                if(input.name == "password" || input.name == "passwordRepeat" || input.name == "phone"){
                    input.value = ""
                }

                if(input.name == "phone"){
                    input.style.border = "2px red solid"
                }
            })
        }
    })
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            resolve(reader.result)
        };
        reader.onerror = function (error) {
            reject(error)
        };
    })
 }