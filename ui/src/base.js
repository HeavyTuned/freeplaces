class FreePlaces {
    constructor() {
        this.filledplaces = {};
        this.places = {};
        this.freeplaces = {};
        this.zones = {};
        this.config = {
            storageLocationIDStart: 12140,
            storageLocationIDEnd: null,
            warehouseID: 1
        };
        this.loadFreePlaces();

        $(".calcplaces").click(function () {
            this.loadFreePlaces();
        });
        $(".showplaces").click(function () {
            this.displayFreePlaces();
        });

        $(".export").click(function () {
            this.exportFreePlacesAsCSV();
        });

        $(".pdf").click(function () {
            this.exportFreePlacesAsPDF();
        });
        $(document).ajaxStart(function () {
            $('#error_body').html("");
            $('#load').modal('show');
        }).ajaxStop(function () {
            $('#load').modal('hide');
        }).ajaxError(function (data) {
            var json = $.parseJSON(data.responseText);
            $('#error_body').append("<div class='find-false'><p>ErrorCode: " + json.error.code + " <br/> Message: " + json.error.message + "</p></div>");
            $('#error_modal').modal('show');
        });
        setInterval(function () {
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

        setTimeout(function () {
            $('.ueberschnittmessage').fadeOut(250);
        }, 7500);
    }

    getJSON(route, data = {}, callback) {
        $.ajax({
            type: "GET",
            url: "/rest/stockmanagement/warehouses/" + this.config.warehouseId + "/stock/storageLocations",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            data: data,
            success: function (data) {
                callback(data);
            },
            error: function (jqXHR, status) {
                callback(data);
            }
        });
    }

    loadFreePlaces() {
        this.getJSON("/rest/stockmanagement/warehouses/" + this.config.warehouseID + "/stock/storageLocations", {
            itemsPerPage: "9999999"
        }, (data) => {
            $.each(data.entries, function (entry) {
                if (entry.quantity > 0) {
                    if (entry.storageLocationId <= 12140) {
                        return true;
                    }
                    /**
                     * Nur neues Lager zeigen
                     */
                    this.filledplaces[entry.storageLocationId] = {};
                    this.filledplaces[entry.storageLocationId] = 1;
                }
            });

            var limit = 50;
            var limitzaehler = 0;
            this.getJSON("/rest/stockmanagement/warehouses/" + this.config.warehouseId + "/management/storageLocations", {
                itemsPerPage: "9999999"
            }, (managementData) => {

                $.each(managementData.entries, function (entry) {
                    if (entry.id < this.config.storageLocationIDStart) {
                        return true;
                    }
                    if (entry.id !== null && entry.id > this.config.storageLocationIDEnd) {
                        return true;
                    }

                    this.places[entry.id] = {};
                    this.places[entry.id] = {
                        name: entry.name,
                        type: entry.type,
                        rack: entry.rackId,
                        shelf: entry.shelfId
                    };
                });
                $("#zoneSelect").empty().append(`<option value="Alle">"Alle"</option>`);
                
                $.each(this.places, function (id, place) {

                    if (typeof (this.filledplaces[id]) != "undefined") {} else {
                        this.freeplaces[id] = {};
                        this.freeplaces[id] = place;

                        var explodedName = place.name.split("-");
                        this.zones[explodedName[0]] = explodedName[0];
                        $("#zoneSelect").append(`<option value="${explodedName[0]}">${explodedName[0]}</option>`);
                    }

                });

            });
        });
    }

    getFreePlaces(exp = 0) {
        if (Object.keys(this.places).length > 0) {
            var limit = $('#freeplaceslimit').val();
            var zone = $('#zoneSelect').val();
            var limitzaehler = 0;
            var results = 0;
            var html = "<table class='table table-striped table-bordered'><th>storageLocationId</th><th>storageLocationName</th>";
            var xreturn = {};
            $.each(this.freeplaces, function (id, place) {
                if (limitzaehler >= limit) {
                    return false;
                }
                if (zone != "Alle") {
                    if (place.name.indexOf(zone) == -1) {
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
            if (exp == "1") {
                html = html.replace("<table", "<table style='border-spacing: 2px !important;' ");
                html = html.replace("<td", "<td style='padding: 2px;' ");
                return html;
            }
            return xreturn;
        } else {
            alert("Bitte berechnen Sie zuerst Ihre freien Lagerorte");
        }
    }
    displayFreePlaces() {

    }
    exportFreePlacesAsPDF() {
        var doc = new jsPDF('p', 'pt');
        var columns = ["StorageLocationId", "StorageLocationName"];
        var rows = [];
        var x = 0;
        var pg = 1;
        $.each(this.returnfreeplaces(2), function () {
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
    exportFreePlacesAsCSV() {
        $('#load').modal('show');
        var csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "storageLocationId;storageLocationName" + "\n";
        $.each(this.returnfreeplaces("2"), function (key, place) {
            csvContent += place[0] + ";" + place[1] + "\n";
        });
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "export.csv");
        document.body.appendChild(link); // Required for FF

        link.click();
        $('#load').modal('hide');
    }

}

$(function(){
    let freeplaces = new FreePlaces();
});