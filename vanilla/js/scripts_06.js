host = 'panu.it';
//host = 'test.mosquitto.org';
if (location.protocol != 'https:') {
	port = 80;
	useTLS = false;
} else {
	port = 443;
	useTLS = true;
}


slidertopic = 'javascript/6/';
cleansession = true;
username = "javascript";
password = "javascript";
casuale = parseInt(Math.random() * 100000000, 16);
clientid = "web_" + casuale.toString(16); 
var mqtt;
var reconnectTimeout = 2000;

function MQTTconnect() {
  if (typeof path == "undefined") {
    path = '/mqtt';
  }
  mqtt = new Paho.MQTT.Client(
  	host,
  	port,
  	path,
  	clientid
  );
  var options = {
    timeout: 3,
    useSSL: useTLS,
    cleanSession: cleansession,
    onSuccess: onConnect,
    onFailure: function (message) {
      $('#status').val("Connection failed: " + message.errorMessage + "Retrying");
      debuglog("Connection failed: " + message.errorMessage + "Retrying");
      setTimeout(MQTTconnect, reconnectTimeout);
    }
  };

  mqtt.onConnectionLost = onConnectionLost;
  mqtt.onMessageArrived = onMessageArrived;

  if (username != null) {
    options.userName = username;
    options.password = password;
  }
  console.log("Host="+ host + ", port=" + port + ", path=" + path + " TLS = " + useTLS + " username=" + username + " password=" + password);
  debuglog("Connecting to server");
  debuglog("Host="+ host + ", port=" + port + ", path=" + path + " TLS = " + useTLS + " username=" + username + " password=" + password + " clientid=" + clientid);
  mqtt.connect(options);
}

// ----------------- ALLA CONNESSIONE -------------
function onConnect() {
  STATUS.firstChild.data='Connected to ' + host + ':' + port + path;
  debuglog('Connected to ' + host + ':' + port + path);
  // Connection succeeded; subscribe to our topic
  mqtt.subscribe(slidertopic + "#", {qos: 0});
  TOPIC.firstChild.data=slidertopic;
}

function onConnectionLost(response) {
setTimeout(MQTTconnect, reconnectTimeout);
  debuglog('Connected lost to ' + host + ':' + port + path);
};


// ----------------- QUANDO ARRIVA UN MESSAGGIO MQTT -------------
function onMessageArrived(message) {

  // estrae il topic dal messaggio
  var topic = message.destinationName;

  // estrae il payload dal messaggio
  var payload = message.payloadString;
  console.log(payload);
  debuglog("Ricevuto da topic " + message.destinationName + " " + payload);
try {  
  var jsonPayload = JSON.parse(payload);

  var valore = jsonPayload.valore;
  var senderid = jsonPayload.senderid;
  var controlid = jsonPayload.controllo;
	
  debuglog("valore slider " + valore);
  debuglog("senderid " + senderid);
  debuglog("controllo " + controlid);

  if (senderid != clientid) {
    var receivedControl = document.getElementById(controlid);
    if ( receivedControl !== null ) {
      var receivedControlType = receivedControl.type;
      if ( receivedControlType == "text" || receivedControlType == "range" || receivedControlType == "textarea" ) {
        receivedControl.value  = valore;
      	debuglog("Controllo " + controlid + " aggiornato a " + valore);
        var receivedControlTxt = document.getElementById(controlid + "Txt");
        if ( receivedControlTxt !== null ) {
          debuglog("Trovato id testo controllo " + controlid + "Txt");
          receivedControlTxt.innerHTML = valore;
        }
      } else if ( receivedControlType == "radio" ) {
	receivedControl.checked = true;
      } else if ( receivedControlType == "select-multiple" ) {
        var x=document.getElementById(controlid);
        for (var i = 0; i < x.options.length; i++) {
          if( jsonPayload.valore[i] == "true") {
            x.options[i].selected = true;
	  } else {
            x.options[i].selected = false;
          }
        }
    
     } else {
        debuglog("Controllo non gestito!");
      }
    } else {
      debuglog("Controllo " + controlid + " non trovato nella pagina!");
    }
  } else {
    debuglog("Controllo non aggiornato, messaggio inviato dal mio id!");
  }
} catch (objError) {
    if (objError instanceof SyntaxError) {
        console.error(objError.name);
	debuglog(objError.name);
    } else {
        console.error(objError.message);
	debuglog(objError.message);
    }
}
};

function debuglog(message) {
  var today = new Date();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var oldInnerHTML = DB.innerHTML;
  if ( oldInnerHTML.length > 50000 ) {
    oldInnerHTML = oldInnerHTML.slice(0,9999);
  }
  DB.innerHTML = time + " ---> " + message + "<br>" + oldInnerHTML;
}

//$(document).ready(function() {
//  MQTTconnect();
//});

function executemqtt(controlid){
  var activatedControl = document.getElementById(controlid);
  var activatedControlType = activatedControl.type;
  debuglog("Il tipo controllo e' " + activatedControlType);
  var activatedControlTxt = document.getElementById(controlid + "Txt");
  if ( activatedControlTxt !== null ) {
	debuglog("Trovato id testo controllo " + controlid + "Txt");
  	activatedControlTxt.innerHTML=activatedControl.value;
  }
  if ( activatedControlType == "range" ) {
  	mqtt.publish(slidertopic + controlid,"{\"controllo\":\"" + controlid + "\", \"valore\":" + activatedControl.value + ",\"senderid\":\""  + clientid + "\"}",qos=0,retained=true);
  } else if ( activatedControlType == "text" || activatedControlType == "radio"  || activatedControlType == "textarea" ) {
	mqtt.publish(slidertopic + controlid,"{\"controllo\":\"" + controlid + "\", \"valore\":" + JSON.stringify(activatedControl.value) + ",\"senderid\":\""  + clientid + "\"}",qos=0,retained=true);
  } else if ( activatedControlType == "select-multiple" ) {
        var x=document.getElementById(controlid);
	var contenuto = "[" ;
        for (var i = 0; i < x.options.length; i++) {
          if(x.options[i].selected ==true){
            //alert(x.options[i].value);
            //debuglog(x.options[i].value);
	    contenuto = contenuto + "\"true\"";
          } else {
	    contenuto = contenuto + "\"false\"";
	  }
        if ( i < ( x.options.length - 1 ) ) {
        contenuto = contenuto + ",";
      }
    
    }
    contenuto = contenuto + "]";
    debuglog(contenuto);
    mqtt.publish(slidertopic + controlid,"{\"controllo\":\"" + controlid + "\", \"valore\":" + contenuto + ",\"senderid\":\""  + clientid + "\"}",qos=0,retained=true);	
  } else {
	debuglog("Control type non handled!");
  }
  debuglog("Control " + controlid + " change to " + activatedControl.value);
}
