const url = "https://nikitadumkin.fun/messengerServer";

function init(){ //runnnig scripts onload body
    checkForToken()
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
            const href = document.createElement("a")
            href.href = "../messages/index.html"
            href.click()
        }
        else{ //если токен недействителен, то он удаляется из хранилища
            localStorage.clear()
        }
    })
}