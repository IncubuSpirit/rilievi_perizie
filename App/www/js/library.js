"use strict"

function inviaRichiesta(method, url, parameters = {}) {
    let contentType;
    if (method.toUpperCase() == "GET")
    {
        contentType = "application/x-www-form-urlencoded; charset=UTF-8"
    }
    else
    {
        contentType = "application/json; charset=UTF-8"
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
        notifica("Error! Connection refused or Server timeout");
    }
    else if(jqXHR.status == 403)
    {
        window.location.href="login.html";
    }
    else if (jqXHR.status == 200)
    {
        notifica("Error! Data format uncorrect: " + jqXHR.responseText);
    }
    else
    {
        notifica("Error! Server Error: " + jqXHR.status + " - " + jqXHR.responseText);
    }
}

function userLogged(callback=null)
{
    let request = inviaRichiesta("POST", "https://stefirca-rilievi-e-perizie.herokuapp.com/api/checkToken");
    let logged = false;
    request.fail(function()
    {
        logged=false;
        if (typeof callback === 'function')
        {
            callback(logged);
        }
        return logged;
    });
    request.done(function(data){
        if(data["ris"]!="noToken")
        {
            logged=true;
        }
        else if (!logged)
        {
            window.location.href="login.html";
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

function logout(msg=true)
{
    let request = inviaRichiesta("POST","https://stefirca-rilievi-e-perizie.herokuapp.com/api/logout");
    reuqest.fail(errore);
    request.done(function(data){
        if(msg)
        {
            
        }
        else
        {
            window.location.href = "login.html";
        }
    });
}

function notifica(msg){		 
    navigator.notification.alert(
        msg,    
        function() {},       
        "Info",       // Titolo finestra
        "Ok"          // pulsante di chiusura
    );			 
}