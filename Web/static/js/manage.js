"use strict"

let regPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

$(document).ready(function(){
    showUsers();

    $("#logout").on("click",function(){
        let request = inviaRichiesta("POST","/api/logout");
        request.fail(errore);
        request.done(function(data){
            window.location="login.html";
        });
    });

    $("#updateUser").on("click",function(){
        if(validateCondition())
        {
            let admin;
            let gender;
            if($('input[name="userType"]:checked').val() == "Admin")
            {
                admin=true;
            }
            else
            {
                admin=false;
            }
            if($('input[name="genderType"]:checked').val() == "M")
            {
                gender="M";
            }
            else
            {
                gender="F";
            }
            let request = inviaRichiesta("POST","/api/updateUser",{
                "username":$("#txtUsername").val(),
                "name":$("#txtName").val(),
                "surname":$("#txtSurname").val(),
                "email":$("#txtEmail").val(),
                "password":CryptoJS.MD5($("#txtPassword").val()).toString(),
                "admin":admin,
                "gender":gender
            });
            request.fail(errore);
            request.done(function(data){
                console.log(data);
                if(data.action=="disconnect")
                {
                    logout();
                }
                else
                {
                    window.location.reload();
                }
            });
        }
    });

    $("#changeUserPassword").on("click",function(){
        if($("#txtUsername").val()!="")
        {
            $("#txtPassword").val(GeneratePassword(12));
        }
        else
        {
            alert("select a user");
        }
    });

    function showUsers()
    {
        //textbox
        $("#txtUsername").val("");
        $("#txtEmail").val("");
        $("#txtSurname").val("");
        $("#txtName").val("");
        $("#txtPassword").val("");
        $('input[name="userType"]:checked').val("");
        $('input[name="genderType"]:checked').val("");

        //tabella
        $("#tBody").empty();

        let request = inviaRichiesta("POST","/api/usersList",{});
        request.fail(errore);
        request.done(function(data){
            if(data.ris != "no-data")
            {
                $(".table").show();    
                for(let i = 0; i<data.ris.length; i++)
                {
                    let trBody = $(`<tr id="${data.ris[i].username}">`);
                    $(`<td>${data.ris[i].username}</td>`).appendTo(trBody);
                    $(`<td>${data.ris[i].name}</td>`).appendTo(trBody);
                    $(`<td>${data.ris[i].surname}</td>`).appendTo(trBody);
                    $(`<td>${data.ris[i].mail}</td>`).appendTo(trBody);
                    $(`<td>${data.ris[i].gender}</td>`).appendTo(trBody);
                    $(`<td>${data.ris[i].isadmin}</td>`).appendTo(trBody);
    
                    trBody.appendTo($("#tBody"));
    
                    trBody.on("click",rowClick)
                }
            }
            else
            {
                $(".table").hide();
                alert("no User found");
            }
        });
    }

    function rowClick()
    {
        let request = inviaRichiesta("POST","/api/userInfo", {"username":this.id});
        request.fail(errore),
        request.done(function(data){
            $("#txtUsername").val(data.username);
            $("#txtName").val(data.name);
            $("#txtSurname").val(data.surname);
            $("#txtPassword").val(data.password);
            $("#txtEmail").val(data.mail);
            if(data.isadmin)
            {
                $("#rdbAdmin").prop("checked","checked");
            }
            else
            {
                $("#rdbUser").prop("checked","checked");
            }
            if(data.gender=="M")
            {
                $("#rdbM").prop("checked","checked");
            }
            else
            {
                $("#rdbF").prop("checked","checked");
            }
        });
    }

    function validateCondition()
    {
        let retVal=false;
        if($("#txtUsername").val() != "")
        {
            if($("#txtName").val() != "")
            {
                if($("#txtSurname").val() != "")
                {
                    if($("#txtEmail").val() != "")
                    {
                        if($("#txtPassword").val() != "")
                        {
                            if(!$("#txtPassword").val().match(regPassword)){
                                alert("Incorrect Password Format");
                            }
                            else{
                                retVal=true;
                            }
                        }
                        else
                        {
                            retVal=false;
                        } 
                    }
                    else
                    {
                        retVal=false;
                    } 
                }
                else
                {
                    retVal=false;
                }  
            }
            else
            {
                retVal=false;
            }
        }
        else
        {
            retVal=false;
        }

        if(!retVal)
        {
            alert("Insert all the info before update");
        }
        return retVal;
    }
});