var weekdays = "umtwfs"; // Define weekdays, calendar starts at Sunday

function getMinuteFromZero(dt){
    // Everything is stored in the JSON as minutes from zero, so, this is a helper function for that
    return dt.getHours() * 60 + dt.getMinutes();
}

function now(){
    var now_ = new Date();
    return getMinuteFromZero(now_);
}

function weekday(dt){
    return weekdays[dt.getDay()];
}

function date(dt){
    return dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate();
}

function todayDate(){
    var now_ = new Date();
    return date(now_);
}

function todayWeekday(){
    var now_ = new Date();
    return weekday(now_);
}

function parseRestaurants(data){
    var final = [];

    for (let restaurant of data["restaurants"]) {
        // Restaurant defaults!
        var rest = {};
        
        var topPriority = restaurant["defaults"]["priority"];
        
        rest["current_meal"] = {}
        if ("color" in restaurant["defaults"]) {
            rest["current_meal"]["color"] = restaurant["defaults"]["color"];
        }
        if ("message" in restaurant["defaults"]) {
            rest["current_meal"]["message"] = restaurant["defaults"]["message"];
        }
        if ("name" in restaurant["defaults"]) {
            rest["current_meal"]["name"] = restaurant["defaults"]["name"];
        }
        rest["id"] = restaurant["id"];
        rest["name"] = restaurant["name"];
    
        // But what about exceptions!
        var restException = {};
    
        for (let exception of data["exceptions"]) {
            if (exception["date"] == todayDate()) {
                for (let restExcept of exception["restaurants"]) {
                    if (restExcept["id"] == restaurant["id"]) {
                        restException = restExcept;
                    }
                }
            }
        }
        
        var allHours = restaurant["hours"];
        
        if (Object.keys(restException).length) {
            if (restException["defaults"]["priority"] <= restaurant["defaults"]["priority"]) {
                topPriority = restException["defaults"]["priority"];
                if ("color" in restException["defaults"]) {
                    rest["current_meal"]["color"] = restException["defaults"]["color"];
                }
                if ("message" in restaurant["defaults"]) {
                    rest["current_meal"]["message"] = restException["defaults"]["message"];
                }
                if ("name" in restException["defaults"]) {
                    rest["current_meal"]["name"] = restException["defaults"]["name"];
                }
                if ("hours" in restException) {
                    allHours = allHours.concat(restException["hours"]);
                }
            }
        }
        
        var hours = []
        for (let hour of allHours) {
            if (hour["end"] >= now() && now() >= hour["start"]) {
                if (hour["days"].includes(todayWeekday())){
                    hours.push(hour);
                }
                
            }
        }
        
        if (hours.length) {
            hours.sort(function(a, b) { return a["priority"] - b["priority"] });
            var min = hours[0];
            console.log(min);
            if (min["priority"] < topPriority) {
                rest["current_meal"]["name"] = min["name"];
                rest["current_meal"]["color"] = min["color"];
                rest["current_meal"]["message"] = min["message"];
            }
        }
        final.push(rest);
    }
    return final.reverse();
    // Reverse it because I push them in reverse and that's bad lol
}

function populate(url) {
    return ajax().get(url).then(function(response, xhr){
        populateTable(parseRestaurants(response));
    });
}

function populateTable(data) {
    var table = document.getElementById("restaurants");
    for(const restaurant of data) {
        var row = table.insertRow(0);
        row.id = restaurant["id"];
        row.innerHTML = "<td><span class=\"status-bullet " + restaurant["current_meal"]["color"] + "\"></span></td><td>" + restaurant["name"] + "</td><td>" + restaurant["current_meal"]["message"] + "</td>";
    }
}

window.onload = function() { populate("http://njitfood.com/njit_food.json"); };
