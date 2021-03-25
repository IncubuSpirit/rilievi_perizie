"use strict";

function inviaRichiesta(method, url, parameters = {}) {
    let contentType;
    if (method.toUpperCase() == "GET")
    {
        contentType = "application/x-www-form-urlencoded; charset=UTF-8";
    }
    else
    {
        contentType = "application/json; charset=UTF-8";
        parameters = JSON.stringify(parameters);
    }

    return $.ajax({
        url: url, //default: currentPage
        type: method,
        data: parameters,
        contentType: contentType,
        dataType: "json",
        timeout: 500000
    });
}

function errore(jqXHR, testStatus, strError) {
    if (jqXHR.status == 0)
    {
        alert("Connection refused or Server timeout");
    }
    /*else if(jqXHR.status == 403)
    {
        window.location.href="login.html";
    }*/
    else if (jqXHR.status == 200)
    {
        alert("Data format uncorrect: " + jqXHR.responseText);
    }
    else
    {
        alert("Server Error: " + jqXHR.status + " - " + jqXHR.responseText);
    }
}

function userLogged(callback=null)
{
    let rqCheckLogin = inviaRichiesta("POST", "/api/checkToken");
    let logged = false;
    rqCheckLogin.fail(function()
    {
        logged=false;
        if (typeof callback === 'function')
        {
            callback(logged);
        }
        return logged;
    });
    rqCheckLogin.done(function(data){
        if(data["ris"]!="noToken")
        {
            logged=true;
        }
        else if (!logged)
        {
            window.location.href="../login.html";
        }
        else
        {
            logged=false;
        }
        if (typeof callback === 'function')
        {
            callback(logged);
        }
        return logged;
    });
}

function GeneratePassword(len){
    var length = len;
    var string = "abcdefghijklmnopqrstuvwxyz"; //to upper 
    var numeric = "0123456789";
    var punctuation = "@$!%*?&";
    var password = "";
    var character = "";
    var crunch = true;
    while( password.length<length ) {
        let entity1 = Math.ceil(string.length * Math.random()*Math.random());
        let entity2 = Math.ceil(numeric.length * Math.random()*Math.random());
        let entity3 = Math.ceil(punctuation.length * Math.random()*Math.random());
        let hold = string.charAt( entity1 );
        hold = (password.length%2==0)?(hold.toUpperCase()):(hold);
        character += hold;
        character += numeric.charAt( entity2 );
        character += punctuation.charAt( entity3 );
        password = character;
    }
    password=password.split('').sort(function(){return 0.5-Math.random()}).join('');
    return password.substr(0,len);
}