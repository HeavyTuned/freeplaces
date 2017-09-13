/**
 * Globale variablen
 */
var warehouses = {};
var filledplaces = {};
var places = {};
var freeplaces = {};
var zones = {};
var calced = 0;
var userId = 0;


function exportfreeplaces() {
    $('#load').modal('show');
    var csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "storageLocationId;storageLocationName" + "\n";
    $.each(returnfreeplaces("2"), function(key, place) {
        csvContent += place[0] + ";" + place[1] + "\n";
    });
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link); // Required for FF

    link.click();
    $('#load').modal('hide')
}

function generatePdf(){
  var doc = new jsPDF('p', 'pt');
  var columns = ["StorageLocationId", "StorageLocationName"];
  var rows = [];
  var x = 0;
  var pg = 1;
  $.each(returnfreeplaces(2), function(){
  	rows[x] = this;
  	x++;
  });
  doc.autoTable(columns, rows, {
    theme: "striped",
    bodyStyles: {
      lineColor: 1,
      lineWidth: 1
    },
    headerStyles: {
      lineColor: 1,
      lineWidth: 1,
      fillColor: 1,
      textColor: 500
    }
  });


  doc.save('FreePlaces.pdf');
}

function getfreeplaces() {
    /**
     * Reset the objects
     */
    filledplaces = {};
    freeplaces = {};
    places = {};
    /**
     * Ajax
     */

    var warehouseId = 1;
    
    zones = {};
    zones["Alle"] = "Alle";
    $.ajax({
        type: "GET",
        url: "/rest/stockmanagement/warehouses/" + warehouseId + "/stock/storageLocations",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        data: {
            itemsPerPage: "9999999"
        },
        success: function(data) {
            $.each(data.entries, function() {
                if (this.quantity > 0) {
                    if(this.storageLocationId <= 12140){return true;} 
                    /**
                     * Nur neues Lager zeigen
                     */
                    filledplaces[this.storageLocationId] = {};
                    filledplaces[this.storageLocationId] = 1;
                }
            });
            /**
             * Wenn die Storagelocations durch sind sucht er sich alle Locations
             */
            var limit = 50;
            var limitzaehler = 0;
            $.ajax({
                type: "GET",
                url: "/rest/stockmanagement/warehouses/" + warehouseId + "/management/storageLocations",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("accessToken")
                },
                data: {
                    itemsPerPage: "9999999"
                },
                success: function(data) {
    
                    $.each(data.entries, function() {
                        if(this.id <= 12140){return true;} 
                        /**
                         * Nur neues Lager zeigen
                         */
                        places[this.id] = {};
                        places[this.id] = {
                            name: this.name,
                            type: this.type,
                            rack: this.rackId,
                            shelf: this.shelfId
                        };
                    });

                    $.each(places, function(id, place) {

                        if (typeof(filledplaces[id]) != "undefined") {} else {
                            freeplaces[id] = {};
                            freeplaces[id] = place;

                            var explodedName = place.name.split("-");
                            zones[explodedName[0]] = explodedName[0];
                        }

                    });

                },

            });

        },

    });

}


function returnfreeplaces(exp) {
    if(exp == undefined){
        var exp = 0;
    }
    if (Object.keys(places).length > 0) {
        var limit = $('#freeplaceslimit').val();
        var zone = $('#zoneSelect').val();
        var limitzaehler = 0;
        var results = 0;
        var html = "<table class='table table-striped table-bordered'><th>storageLocationId</th><th>storageLocationName</th>";
        var xreturn = {};
        $.each(freeplaces, function(id, place) {
            if (limitzaehler >= limit) {
                return false;
            }
            if(zone != "Alle"){
                if(place.name.indexOf(zone)==-1){
                    return true;
                }
            }

            limitzaehler++;
            results++;
            html = html + "<tr><td>" + id + "</td><td>" + place.name + "</td></tr>";
            xreturn[results] = {};
            xreturn[results] = [id, place.name];
        

        });
        html = html + "</table>";
        if (exp == "0") {
            if (results > 0) {
                $('#freeplacesausgabe').html(html);
            } else {
                $('#freeplacesausgabe').html("<hr><p style='color: red;'>Keine Lagerorte gefunden.</p>");
            }
        }
        if(exp == "1")
        {
          html = html.replace("<table", "<table style='border-spacing: 2px !important;' ");
          html = html.replace("<td", "<td style='padding: 2px;' ");
          return html;
        }
        return xreturn;
    } else {
        alert("Bitte berechnen Sie zuerst Ihre freien Lagerorte");
    }
}

function togglefreielagerorte() {
    $('#freeplacesdialog').dialog("open");
}

function deletefreeplace(id) {
    delete freeplaces[id];
    returnfreeplaces();
}

/**
 * Wenn das dokument ready ist
 */
$(document).ready(function() {
    /**
     * Wenn ein Ajax-Request gestartet wird
     */
    $(document).ajaxStart(function() {
        $('#error_body').html("");
        $('#load').modal('show');
    }).ajaxStop(function() {
        $('#load').modal('hide');
    }).ajaxError(function(data) {
        var json = $.parseJSON(data.responseText);
        $('#error_body').append("<div class='find-false'><p>ErrorCode: " + json.error.code + " <br/> Message: " + json.error.message + "</p></div>");
        $('#error_modal').modal('show');
    });



    getfreeplaces();
    $('.showplaces').click(function() {
        returnfreeplaces();
    });
    $('.calcplaces').click(function() {
        getfreeplaces();
    });
    
    $('.export').click(function() {
        exportfreeplaces();
    });
    $('.pdf').click( function(){
        generatePdf();
    });

    setInterval(function() {
        var pins = $('#loadingpins').attr("pins");
        switch (pins) {
            case "0":
                $('#loadingpins').text(".");
                $('#loadingpins').attr("pins", "1");
                break;
            case "1":
                $('#loadingpins').text("..");
                $('#loadingpins').attr("pins", "2");
                break;
            case "2":
                $('#loadingpins').text("...");
                $('#loadingpins').attr("pins", "3");
                break;
            case "3":
                $('#loadingpins').text("....");
                $('#loadingpins').attr("pins", "0");
                break;

        }
    }, 500);

    setTimeout(function() {
        $('.ueberschnittmessage').fadeOut(250);
    }, 7500);
});
