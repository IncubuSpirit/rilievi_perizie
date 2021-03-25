"use strict"

$(document).ready(function(){
    document.addEventListener("deviceready", function () {
        let txtUsername = $("#txtUsername");
        let txtPassword = $("#txtPassword");
        let txtNewPassword=$("#txtNewPassword");
        let txtRepPassword=$("#txtRepPassword");
        let loginForm=$("#loginForm");
        let changePassForm=$("#changePassForm").hide();
    
        $(document).on('keydown', function(e) {
            if (e.keyCode == 13)
            {
                login();
            }
        });
    
        $("#login").on("click",function(){
            login();
        });
        $("#Change").on("click",function(){
            changePass();
        })
    
        function login()
        {
            if(txtUsername.val()!="" && txtPassword.val()!="")
            {
                let request = inviaRichiesta("POST","https://stefirca-rilievi-e-perizie.herokuapp.com/api/login",{"username":txtUsername.val(),"password":CryptoJS.MD5(txtPassword.val()).toString()});
                request.fail(errore);
                request.done(function(data){
                    if(data.ris=="isfirst")
                    {
                        loginForm.hide();
                        changePassForm.show();
                    }
                    else
                    {
                        window.location.href = "/index.html";
                    }
                });
            }
            else{
                notifica("username or password is missing");
            }
        }
    
        function changePass(){
            if(txtNewPassword.val()!="" && txtRepPassword.val()!="")
            {
                if(txtNewPassword.val().match(regPassword)){
                    if(txtNewPassword.val() == txtRepPassword.val()){
                        let request = inviaRichiesta("POST","https://stefirca-rilievi-e-perizie.herokuapp.com/api/changePassword",{"username":txtUsername.val(),"password":CryptoJS.MD5(txtPassword.val()).toString()});
                        request.fail(errore);
                        request.done(function(){
                                window.location = "/";
                        });
                    }
                    else{
                        notifica("the two password don't match");
                    }
                }
                else{
                    notifica("insert a valid password");
                }
            }
            else{
                notifica("complete the field");
            }
        }
    });
});