let connected_flag = 0
let mqtt;
let reconnectTimeout = 2000;

// initialise original map
let map = L.map('map').setView([51.0447, -114.0719], 6);

//create OSM Layer
let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
osm.addTo(map);


let marker, circle;


function onConnectionLost() {
    console.log("Connection lost");
    document.getElementById("status").innerHTML = "Connection Lost";
    document.getElementById("messages").innerHTML = "Reconnecting";
    connected_flag = 0;

    MQTTconnect()
}
function onFailure(message) {
    console.log("Failed to connect");
    document.getElementById("messages").innerHTML = "Connection Failed - Reconnecting";
    setTimeout(MQTTconnect, reconnectTimeout);
}
function onMessageArrived(r_message) {
    const obj = JSON.parse(r_message.payloadString);

    let lat = obj.latitude
    let long = obj.longitude
    let accuracy = obj.precision
    let temp = obj.temperature
    

    if (marker) {
        map.removeLayer(marker)
    }

    if (circle) {
        map.removeLayer(circle)
    }
    
    let greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    let blueIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    let redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    let blackIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

   
    if (temp < 10 && temp >= -40) {
        //blue icon
        marker = L.marker([lat, long], { icon: blueIcon })
        circle = L.circle([lat, long], { radius: accuracy })
        marker.bindPopup("Temperature: " + temp).openPopup();
        console.log("blueIcon");
    }
    else if (temp >= 10 && temp < 30) {
        //green icon
        marker = L.marker([lat, long], { icon: greenIcon })
        circle = L.circle([lat, long], { radius: accuracy, color: 'green' })
        marker.bindPopup("Temperature: " + temp).openPopup();
        console.log("greenIcon");
    }
    else if (temp >= 30 && temp <= 60) {
        //then red icon 
        marker = L.marker([lat, long], { icon: redIcon })
        circle = L.circle([lat, long], { radius: accuracy, color: 'red' })
        marker.bindPopup("Temperature: " + temp).openPopup();
        console.log("redIcon");
    }
    else {
        marker = L.marker([lat, long], { icon: blackIcon })
        circle = L.circle([lat, long], { radius: accuracy, color: 'black' })
        marker.bindPopup("Temperature: " + temp).openPopup();
    }


    let featureGroup = L.featureGroup([marker, circle]).addTo(map)

    map.fitBounds(featureGroup.getBounds())

    out_msg = "Message received " + obj + "<br>";
    out_msg = out_msg + "Message received on Topic " + r_message.destinationName;
    //console.log("Message received ",r_message.payloadString);
    console.log(out_msg);
    document.getElementById("messages").innerHTML = out_msg;
}
function onConnected(recon, url) {
    console.log(" inside onConnected " + reconn);
}
function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    document.getElementById("messages").innerHTML = "Connected to " + host + "on port " + port;
    connected_flag = 1
    document.getElementById("status").innerHTML = "Connected";
    console.log("on Connect " + connected_flag);
}

function disconnect() {
    console.log("attempting to disconnect");
    if (connected_flag == 1)
        console.log("disconnecting");
    mqtt.disconnect();
    document.getElementById("server").disabled = false;
    document.getElementById("port").disabled = false;
    document.getElementById("port_submit").disabled = false;


}
function MQTTconnect() {
    document.getElementById("messages").innerHTML = "";
    let s = document.forms["connform"]["server"].value;
    let p = document.forms["connform"]["port"].value;
    if (p != "") {
        port = parseInt(p);
        console.log("port" + port);
    }
    if (s != "") {
        host = s;
        console.log("host" + host);
    }

    console.log("Attempting Connection to " + host + " " + port);
    let x = Math.floor(Math.random() * 10000);
    let cname = "orderform-" + x;
    console.log (cname);
    mqtt = new Paho.MQTT.Client(host, port, cname);
    console.log (mqtt);
    let options = {
        timeout: 3,
        onSuccess: onConnect,
        onFailure: onFailure,

    };

    mqtt.onConnectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;

    mqtt.connect(options);

    document.getElementById("server").disabled = true;
    document.getElementById("port").disabled = true;
    document.getElementById("port_submit").disabled = true;

    return false;


}
function sub_topics() {
    document.getElementById("messages").innerHTML = "";
    if (connected_flag == 0) {
        out_msg = "No Connection therefore subscribtion for topic is not possible at this time"
        console.log(out_msg);
        document.getElementById("messages").innerHTML = out_msg;
        return false;
    }
    let stopic = document.forms["subs"]["Stopic"].value;
    console.log("Subscribing to topic =" + stopic);
    mqtt.subscribe(stopic);
    return false;
}

function generateTemp() {
    let pos = 60,
        neg = 40,
        includeZero = false,
        result;

    do result = Math.ceil(Math.random() * (pos + neg)) - neg;
    while (includeZero === false && result === 0);

    console.log(result)

    return result;
}
function getPosition(position) {
    console.log(position)
    let lat = position.coords.latitude
    let long = position.coords.longitude
    let accuracy = position.coords.accuracy

    let temp = generateTemp();
    let msg = position

    console.log(msg);

    let topic = "ENGO551/Lab4/temperature";

    const geo_data = { latitude: lat, longitude: long, precision: accuracy, temperature: temp };

    message = new Paho.MQTT.Message(JSON.stringify(geo_data));

    message.destinationName = topic;

    mqtt.send(message);
    return false;

    console.log("Your coordinate is: Lat: " + lat + " Long: " + long + " Accuracy: " + accuracy)
}

function send_message() {
    document.getElementById("messages").innerHTML = "";
    if (connected_flag == 0) {
        out_msg = "No Connection therefore sending messages is not possible at this time"
        console.log(out_msg);
        document.getElementById("messages").innerHTML = out_msg;
        return false;
    }
    let msg = document.forms["sendmessage"]["message"].value;

    console.log(msg);

    let topic = document.forms["sendmessage"]["Ptopic"].value;

    message = new Paho.MQTT.Message(msg);
    if (topic == "")
        message.destinationName = "test-topic"
    else
        message.destinationName = topic;
    mqtt.send(message);
    return false;
}

function send_location() {
    if (!navigator.geolocation) {
        console.log("Your browser doesn't support geolocation feature")
    } else {
        navigator.geolocation.getCurrentPosition(getPosition)
    }
}