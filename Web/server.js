"use strict";

//#region  require
//fs
const fs = require("fs");

//server
const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 1337;
const SRVR_LOG = ">>>>>>>> ";
let errorPage;

//mongo
let mongo = require("mongodb");
let ObjectID = mongo.ObjectID;
let mongoClient = mongo.MongoClient;
const CONNECTIONSTRING = "mongodb+srv://admin:admin@cluster0.ttpzq.mongodb.net/?retryWrites=true&w=majority";
const CONNECTIONOPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};
const DBNAME = "Rilievi_e_Perizie";

//nodemailer
const nodemailer = require("nodemailer");
let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'scuola.stefirca.alex@gmail.com',
        pass: 'Pass4w0rd!'
    }
});

//cookie
let jwt = require("jsonwebtoken");
const TTL = 1296000; //15 gg
const NO_COOKIES = "No cookies found";
let PRIVATE_KEY;

//cloudinary
const cloudinary = require("cloudinary").v2;
const CLOUDINARY_URL = "CLOUDINARY_URL=cloudinary://566151146433116:P6yNKnfei9Q3UPBTSUQSoX6LEYA@rilievieperizie";
cloudinary.config({
    cloud_name: 'rilievieperizie',
    api_key: '566151146433116',
    api_secret: 'P6yNKnfei9Q3UPBTSUQSoX6LEYA'
});

let bcrypt = require("bcryptjs");
const colors = require("colors");
const bodyParser = require("body-parser");
const passwordGenerator = require("uuid").v4;
const md5 = require("md5");

//#endregion

init();

server.listen(PORT, function () {
    console.log(`${colors.green("[" + new Date().toLocaleTimeString() + "]")}${SRVR_LOG}Server listening on port: ${PORT}`);
});

//#region Function
function init() {
    fs.readFile("./static/error.html", function (err, data) {
        if (!err) {
            errorPage = data.toString();
        } else {
            errorPage = '<h1 style="color:red;text-align:center;">- Page or resource not found -</h1><br><a class="btn btn-primary" style="margin:0 auto;" href="/index.html">Home</a>';
        }
    });
    fs.readFile("./keys/privateToken.key", function (err, data) {
        if (!err) {
            PRIVATE_KEY = data.toString();
        } else {
            console.log(err);
            console.log("The private key is missing");
            server.close();
        }
    });

    app.response.log = function (message) {
        console.log(message);
    };
}

function checkToken(req, res, next, method = "GET") {
    let token = readCookie(req);
    if (token == NO_COOKIES) {
        if (method.toUpperCase() == "POST") {
            return {
                "ris": "noToken"
            };
        } else {
            sendError(req, res, 403, "Token mancante");
        }
    } else {
        jwt.verify(token, PRIVATE_KEY, function (err, payload) {
            if (err) {

                if (method.toUpperCase() == "POST") {
                    return {
                        "ris": "noToken"
                    }
                } else {
                    //se la richiesta non è /api, bisogna mandare la pagina di login
                    sendError(req, res, 403, "Token expired or corrupted");
                }
            } else {
                setTokenAndCookie(payload, res);
                req.payload = payload;
                if (method.toUpperCase() == "POST") {
                    return {
                        "ris": "ok",
                        "payload": payload
                    }
                } else {
                    next();
                }
            }
        });
    }
    return {
        "ris": "no return required"
    };
}

function sendError(req, res, cod, errMex) {
    if (req.originalUrl.startsWith("/api/")) {
        res.status(cod).send(errMex);
    } else {
        res.sendFile(`${__dirname}/static/login.html`);
    }
}

function setTokenAndCookie(payload, res) {
    let newToken = createToken(payload);
    writeCookie(res, newToken);
}

function readCookie(req) {
    let valoreCookie = NO_COOKIES;
    if (req.headers.cookie) {
        let cookies = req.headers.cookie.split(";");
        for (let item of cookies) {
            item = item.split("=");
            if (item[0].includes("token")) {
                valoreCookie = item[1];
                break;
            }
        }
    }
    return valoreCookie;
}

function createToken(data) {
    let param = {
        "username": data.username,
        "name": data.name,
        "surname": data.surname,
        "mail":data.mail,
        "gender":data.gender,
        "iat": data.iat || Math.floor(Date.now() / 1000),
        "exp": Math.floor(Date.now() / 1000) + TTL
    }
    let token = jwt.sign(param, PRIVATE_KEY);
    return token;
}

function writeCookie(res, token) {
    res.set("Set-Cookie", `token=${token};max-age=${TTL};path=/;httponly=true;`);
}
//#endregion

/* ********************** Express listener ********************** */

app.use("*", function (req, res, next) {
    console.log(">>>>>>>> Risorsa: " + req.originalUrl.split('?')[0] + ".");
    next();
});

app.get("/", checkToken);

app.get("/index.html", checkToken);

//Route di lettura dei parametri post.
app.use(bodyParser.json({
    limit: '10mb',
    extended: true
}));
app.use(bodyParser.urlencoded({
    limit: '10mb',
    extended: true
}));

app.use(express.json({
    limit: '1000mb'
}));

//Route relativa alle risorse statiche
app.use('/', express.static("./static"));

app.post("/api/checkToken", function (req, res, next) {
    let token = checkToken(req, res, next, "POST");
    if (token["ris"] != "noToken") {
        res.send({
            "ris": "token",
            "username": req.payload.username,
            "name": req.payload.name,
            "surname": req.payload.surname,
            "email": req.payload.mail,
            "gender": req.payload.gender
        });
    } else {
        res.send(token);
    }
});

app.post('/api/login', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Database connection error.");
        } else {
            let db = client.db(DBNAME);
            let coll = db.collection('User');

            let username = req.body.username;
            let password = req.body.password;
            let admin = req.body.admin;


            coll.findOne({
                "username": username
            }, function (err, dbUser) {
                if (err) {
                    res.status(500).send("Internal Error in Query Execution.");
                } else {
                    if (dbUser == null) {
                        res.status(401).send("User not found.");
                    } else {
                        if (admin) {
                            if (!dbUser.isadmin) {
                                res.status(401).send("user not allowed here.");
                            }
                        }
                        bcrypt.compare(password, dbUser.password, function (err, ok) {
                            if (err) {
                                res.status(500).send("Internal Error in bcrypt compare.");
                            } else {
                                if (!ok) {
                                    res.status(401).send("password not correct.");
                                } else {
                                    if (dbUser.isfirst) {
                                        setTokenAndCookie(dbUser, res);
                                        res.send({
                                            "ris": "isfirst"
                                        });
                                        client.close();
                                    } else {
                                        setTokenAndCookie(dbUser, res);
                                        res.send({
                                            "ris": "ok"
                                        });
                                        client.close();
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });
});

app.post("/api/changePassword", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Database connection error.");
        } else {
            let username = req.body.username;
            let password = bcrypt.hashSync(req.body.password, 10);

            let db = client.db(DBNAME);
            let coll = db.collection("User");
            coll.updateOne({
                "username": username
            }, {
                $set: {
                    "password": password,
                    "isfirst": false
                }
            }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal server error.");
                    client.close();
                } else {
                    setTokenAndCookie(data, res);
                    res.send({
                        "ris": "ok"
                    });
                    client.close();
                }
            });
        }
    });
});

app.use("/api", checkToken);

app.post('/api/logout', function (req, res, next) {
    res.set("Set-Cookie", "token=;max-age=-1;Path=/;httponly=true;");
    res.send({
        "ris": "ok"
    });
});

app.post("/api/register", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Database connection error.");
        } else {
            let username = req.body.username;
            let name = req.body.name;
            let surname = req.body.surname;
            let email = req.body.email;
            let isadmin = req.body.isadmin;
            let gender = req.body.gender;
            let password = passwordGenerator();
            let criptedPass = md5(password);
            criptedPass = bcrypt.hashSync(criptedPass, 10);

            let db = client.db(DBNAME);
            let coll = db.collection("User");
            coll.findOne({
                "username": username
            }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal Error in Query Execution.");
                } else {
                    if (data == null) {
                        coll.insertOne({
                            "name": name,
                            "surname": surname,
                            "username": username,
                            "password": criptedPass,
                            "mail": email,
                            "gender": gender,
                            "isadmin": isadmin,
                            "isfirst": true
                        }, function (err, data) {
                            if (err) {
                                res.status(500).send("Internal Error in Query Execution.");
                            } else {
                                fs.readFile("./templateEmail.html", function (err, data) {
                                    let messageHtml;
                                    if (!err) {
                                        let teamplate = handlebars.compile(data.toString());
                                        messageHtml = teamplate({
                                            "Titolo": "Welcome on board!",
                                            "Messaggio_A": `An administrator has created you an account for "rilievi e perizie".
                                                    Your Username is: ${username}
                                                    Your Password is: ${password}
                                                    You need to change it at the first loging.
                                                    If you think this is an error pleas contact us at "p.stefirca.0882@vallauri.edu".`,
                                            "Messaggio_B": "See you soon."
                                        });
                                    } else {
                                        messageHtml = `<h1>Rilievi-e-Perizie</h1>
                                        <p>An administrator has subscribed an user with this mail to the portal of "rilievi e perizie".
                                        If you think this is an error please contact as soon as possible.</p>
                                        <br>
                                        <p>"p.stefirca.0882@vallauri.edu".</p>
                                        <br>
                                        <p>Your Username is: ${username}</p>
                                        <p>Your Passowrd is: ${password}</p>
                                        <br>
                                        <p>Keep it secrete.</p>
                                        <p>also it will be changed on the first startup.</p>`
                                    }

                                    let mailOptions = {
                                        from: 'scuola.stefirca.alex@gmail.com',
                                        to: email,
                                        subject: 'Registration to Rilievi-e-Perizie',
                                        html: messageHtml
                                    };

                                    // invio il messaggio
                                    transporter.sendMail(mailOptions, function (error, info) {
                                        if (error) {
                                            res.send({
                                                "ris": "ok"
                                            });
                                            console.log("Error on sending message:     " + error);
                                        } else {
                                            res.send({
                                                "ris": "ok"
                                            });
                                        }
                                    });
                                    client.close();
                                });
                            }
                        });
                    } else {
                        res.send({
                            "ris": "User already exist"
                        });
                    }
                }
            });
        }
    });
});

app.post("/api/showCard", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Database connection error.");
        } else {
            let db = client.db(DBNAME);
            let coll= db.collection("Photo");
            coll.find().project({
                "user": 1,
                "img": 1,
                "note":1
            }).toArray(function (err, data) {
                if (err) {
                    res.status(500).send("Internal server error.");
                } else {
                    if (data.length == 0) {
                        res.send({
                            "ris": "no-data"
                        });
                    } else {
                        res.status(200).send({
                            "ris": data
                        });
                    }
                }
                client.close();
            });
        }
    });
});

app.post("/api/usersList", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Database connection error.");
        } else {
            let db = client.db(DBNAME);
            let coll = db.collection("User");
            coll.find().project({
                "_id":0,
                "username": 1,
                "name": 1,
                "surname": 1,
                "mail": 1,
                "gender":1,
                "isadmin":1
            }).toArray(function (err, data) {
                if (err) {
                    res.status(500).send("Internal server error.");
                } else {
                    if (data.length == 0) {
                        res.send({
                            "ris": "no-data"
                        });
                    } else {
                        res.status(200).send({
                            "ris": data
                        });
                    }
                }
                client.close();
            });
        }
    });
});

app.post("/api/userInfo", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Database connection error.");
        } else {
            let db = client.db(DBNAME);
            let collUsers = db.collection("User");
            collUsers.findOne({
                "username": req.body.username
            }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal server error.");
                } else {
                    if (data.length == 0) {
                        res.send({
                            "ris": "no-data"
                        });
                    } else {
                        res.status(200).send(data);
                    }
                }
                client.close();
            });
        }
    });
});

app.post("/api/updateUser", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Database connection error.");
        } else {
            let db = client.db(DBNAME);
            let collUsers = db.collection("User");

            let username = req.body.username;
            let name = req.body.name;
            let surname = req.body.surname;
            let email = req.body.email;
            let password = bcrypt.hashSync(req.body.password, 10);
            let admin = req.body.admin;
            let gender = req.body.gender;

            collUsers.updateOne({
                "username":username
            }, {
                $set: {
                    "name": name,
                    "surname": surname,
                    "mail": email,
                    "password":password,
                    "isadmin":admin,
                    "gender":gender
                }
            }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal server error.");
                } else {
                    if (data.result.nModified == 1) {
                        if (req.payload.username == username) {
                            res.send({
                                "ris": "ok",
                                "action": "disconnect"
                            });
                        } else {
                            res.send({
                                "ris": "ok",
                                "action": "reload"
                            });
                        }
                    } else {
                        res.send({
                            "ris": "no-mod"
                        });
                    }
                }
                client.close();
            });
        }
    });
});

/* *************** API applicazione android *************** */

app.post("/api/insertPhoto", function (req, res, next) {
    let pos = req.body.pos;
    let note = req.body.note;
    let img = [];
    for (let imgUrl of req.body.imgUrl) {
        img.push(imgUrl);
    }
    let user = req.payload.username;
    let date = req.body.date;

    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Database connection error.");
        } else {
            let db = client.db(DBNAME);
            let coll = db.collection('Photo');
            coll.insertOne({
                "pos": pos,
                "note": note,
                "img": img,
                "user": user,
                "date": date
            }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal Server Error");
                } else {
                    res.send({
                        "ris": "ok"
                    });
                }
                client.close();
            });
        }
    });
});

app.post("/api/uploadImage", function (req, res, next) {
    let img = req.body.img;
    cloudinary.uploader.upload(`data:image/jpeg;base64,${img}`, {
        overwrite: true,
        invalidate: true
    }, function (error, result) {
        res.send({
            "ris": result
        });
    });
});

/*************************** ERROR ROUTE **************************** */

/*
 * If no previous route is valid for the request this one is done. Send the error page.
 */
app.use("*", function (req, res, next) {
    res.status(404);
    if (req.originalUrl.startsWith("/api/")) {
        //res.json("Sorry, can't find the resource you are looking for.");
        res.send("Resource not found.");
    } else {
        res.send(errorPage);
    }
});

/*
 * If the server generate an error this route is done. Send the http response code 500.
 */
app.use(function (err, req, res, next) {
    console.log(err.stack); //Stack completo (default).
    if (!err.codice) {
        err.codice = 500;
        err.message = "Internal Server Error.";
        //server.close();
    }
    res.status(err.codice);
    res.send(err.message);
});