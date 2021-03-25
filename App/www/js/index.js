"use strict";

let regPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;;

$(document).ready(function () {
    document.addEventListener("deviceready", function () {
        userLogged();
        let mapID = null;
        let watchID = null;
        let img=[];
        let cameraOptions = {"quality":50}
        let pos = {};

        $("#btnLogout").on("click",function(){
            logout();
        });

        $("#btnScatta").on("click", function () {
            cameraOptions.sourceType = Camera.PictureSourceType.CAMERA;
            cameraOptions.destinationType = Camera.DestinationType.DATA_URL;
            navigator.camera.getPicture(successCamera, error, cameraOptions);
            $("#btnScatta").prop("disabled",true);
        });

        $("#btnUploadPhoto").on("click",function(){
            
            if(img.length == 0)
            {
                notifica("Take a picture");
            }
            else
            {
                $("#btnUploadPhoto").prop("disabled",true);
                startWatchGps();
            }
        });

        function successCamera(image) {
            if (cameraOptions.destinationType == Camera.DestinationType.DATA_URL) {
                let request = inviaRichiesta("POST","https://stefirca-rilievi-e-perizie.herokuapp.com/api/uploadImage",{"img":img});
                request.fail(errore);
                request.done(function(data){
                    img.push(data.ris["secure_url"]);
                    notifica("photo taken");
                    $("#btnScatta").prop("disabled",false);
                });
            }
        }

        function successGps(position) {
            pos = {
                lat:position.coords.latitude,
                lng:position.coords.longitude
            }
            stopWatchGps();
        }

        function startWatchGps() {
            let gpsOptions = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };
            watchID = navigator.geolocation.watchPosition(successGps, error, gpsOptions);
            if (watchID == null)	
            {
                notifica("location unknown");
            }	       
        }

        function stopWatchGps(){
            if (watchID != null)
            {	
                navigator.geolocation.clearWatch(watchID);
                watchID=null;
                mapID=null;
            }

            let dateNow = new Date();
            let request = inviaRichiesta("POST","https://stefirca-rilievi-e-perizie.herokuapp.com/api/insertPhoto", {
                "pos":pos,
                "note":$("#txtNote").val(),
                "img":img,
                "date":`${dateNow.toISOString().replace('-', '/').split('T')[0].replace('-', '/')} - ${dateNow.getHours()}:${dateNow.getMinutes()}`});
            request.fail(errore);
            request.done(function(data){
                if(data.ris == "ok")
                {
                    notifica("Upload done");
                    img=[];
                    $("#txtNote").val("");
                    $("#txtTitle").val("");
                }
                else
                {
                    alert("")
                }
                $("#btnUploadPhoto").prop("disabled",false);
            });	
        }
        
        function error(err) {
            if (err.code) {
                notifica()
            }
            $("#btnScatta").prop("disabled",false);
            $("#btnUploadPhoto").prop("disabled",false);
        }
    });
});