"use strict";

let regEmail = /^[A-z0-9\.\+_-]+@[A-z0-9\._-]+\.[A-z]{2,6}$/;

$(document).ready(function(){
    let txtName=$("#txtName");
    let txtSurname=$("#txtSurname");
    let txtEmail=$("#txtEmail");
    let txtUsername=$("#txtUsername");
    let switchAdmin = $("#switchAdmin");
    let switchGender=$("#swtichGender");

    $("#admin").hide();
    $("#user").show();

    $("#logout").on("click",function(){
        let request = inviaRichiesta("POST","/api/logout");
        request.fail(errore);
        request.done(function(data){
            window.location="login.html";
        });
    });

    switchAdmin.on("change",function(){
        if(switchAdmin.val() == "User")
        {
            switchAdmin.prop("value","Admin");
            $("#admin").show();
            $("#user").hide();
        }
        else
        {
            switchAdmin.prop("value","User");
            $("#admin").hide();
            $("#user").show();
        }
    });

    switchGender.on("change",function(){
        if(switchGender.val() == "M")
        {
            switchGender.prop("value","F");
        }
        else
        {
            switchGender.prop("value","M");
        }
    });

    $("#btnRegister").on("click", function(){
        if(checkField())
        {
            let request = inviaRichiesta("POST","/api/register",{
                "username":txtUsername.val(),
                "email":txtEmail.val(),
                "name":txtName.val(),
                "surname":txtSurname.val(),
                "isadmin":(switchAdmin.val() == "Admin"? true: false),
                "gender":(switchGender.val() == "F"? "F": "M")
            });
            request.fail(errore);
            request.done(function(data){
                if(data.ris=="User already exist")
                {
                    alert("The user already exist");
                }
                else
                {
                    alert("email sent");
                }
            });
        }
    });

    function checkField()
    {
        let retVal=false;
        if(txtName.val() != "" && txtSurname.val() != "" && txtEmail.val() != ""&& txtUsername.val() != "")
        {
            if(txtEmail.val().match(regEmail))
            {
                retVal=true;
            }
            else
            {
                alert("Wrong Email Format");
                retVal=false;
            }
        }
        else
        {
            alert("All the fields have to be filled");
            retVal=false;
        }
        return retVal;
    }
});