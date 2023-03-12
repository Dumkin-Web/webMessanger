const url = "https://nikitadumkin.fun/messengerServer";

function init(){ //runnnig scripts onload body
    console.log('hi');
    readReq();
}

function readReq(){ //getting url params
    const queryRaw = window.location.search;
    const urlParams = new URLSearchParams(queryRaw);
    const userPhone = urlParams.get("user_phone")

    if(!userPhone){
        history.back()
    }

    fetchUserData(userPhone);
}

function fetchUserData(phone){
    const token = localStorage.getItem("token");

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