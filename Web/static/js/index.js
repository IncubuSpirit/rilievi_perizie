"use strict";

const html="<div class='card' style='width: 18rem;'><img class='card-img-top' src='{{img}}' alt='Card image cap'><div class='card-body'><p class='card-text'>{{txt}}</p></div></div>";

$(document).ready(function(){

    let wrapper = $("#wrapper");
    showCard();

    $("#logout").on("click",function(){
        let request = inviaRichiesta("POST","/api/logout");
        request.fail(errore);
        request.done(function(data){
            window.location="login.html";
        });
    });

    function showCard(){
        let request=inviaRichiesta("POST","/api/showCard");
        request.fail(errore);
        request.done(function(data){
            if(data.ris!="no-data"){
                for(let item of data.ris){
                    let txt="User: "+item.user+"<br>Note: "+item.note;
                    let card=$("<div class='card' style='width: 18rem; display:inline-block;'><img class='card-img-top' src='"+item.img+"' alt='Card image cap'><div class='card-body'><p class='card-text'>"+txt+"</p></div></div>");
                    card.appendTo(wrapper);
                }
            }
        })
    }
});