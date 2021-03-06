class FreePlaces {
    constructor() {
        this.filledplaces = {};
        this.places = {};
        this.freeplaces = [];
        this.zones = {};
        this.config = {
            storageLocationIDStart: 12140,
            storageLocationIDEnd: null,
            warehouseId: 1
        };
        this.countDots = 1;
        this.loadFreePlaces();

        $(".calcplaces").click(()=>{
            this.loadFreePlaces();
        });
        $(".showplaces").click(()=>{
            this.displayFreePlaces();
        });

        $(".export").click(()=>{
            this.exportFreePlacesAsCSV();
        });

        $(".pdf").click(()=>{
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
            $('#loadingpins').text(".".repeat(this.countDots));
            this.countDots = this.countDots +1;
            if(this.countDots > 3){
                this.countDots = 1;
            }
        }, 500);

        setTimeout(function () {
            $('.ueberschnittmessage').fadeOut(250);
        }, 7500);
    }

    getJSON(route, data = {}, callback) {
        $.ajax({
            type: "GET",
            url: route,
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
    
    compare(a,b) {
        if (a.position < b.position)
          return -1;
        if (a.position > b.position)
          return 1;
        return 0;
      }
      
      
    loadFreePlaces() {
        $("#load").show();
        this.getJSON("/rest/stockmanagement/warehouses/" + this.config.warehouseId + "/stock/storageLocations", {
            itemsPerPage: "9999999"
        }, (data) => {
            $.each(data.entries, (id, entry)=>{
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

                $.each(managementData.entries, (id, entry)=> {
                    
                    if (entry.id < this.config.storageLocationIDStart) {
                        return true;
                    }
                    this.places[entry.id] = {};
                    this.places[entry.id] = {
                        name: entry.name,
                        position: entry.position,
                        id: entry.id
                    };
                });
                $("#zoneSelect").empty().append(`<option value="Alle">Alle</option>`);
                
                $.each(this.places, (id, place) => {
                    
                    if (typeof this.filledplaces[id] == "undefined") {
                        this.freeplaces.push(place);
                        var explodedName = place.name.split("-");
                        if(this.zones[explodedName[0]] == undefined){
                            $("#zoneSelect").append(`<option value="${explodedName[0]}">${explodedName[0]}</option>`);                            
                        }
                        this.zones[explodedName[0]] = explodedName[0];
                    }

                });
                this.freeplaces.sort(this.compare);
                $("#load").hide();

            });
        });
    }

    getFreePlaces(displayAs = 0) {
        if (Object.keys(this.places).length > 0) {
            var limit = $('#freeplaceslimit').val();
            var zone = $('#zoneSelect').val();
            var results = 0;
            var html = "<table class='table table-striped table-bordered'><th>storageLocationId</th><th>storageLocationName</th>";
            var xreturn = {};

            $.each(this.freeplaces, (id, place)=>{
                
                if (zone != "Alle") {
                    if (place.name.indexOf(zone+"-") == -1) {
                        return true;
                    }
                }
                if (results >= limit) {
                    return false;
                }

                results++;
                html = html + `<tr><td>${place.id}</td><td data-position="${place.position}">${place.name}</td></tr>`;
                xreturn[results] = {};
                xreturn[results] = [place.id, place.name];


            });
            html = html + "</table>";
            if (displayAs == "0") {
                $('#freeplacesausgabe').html((results>0) ? html :"<hr><p style='color: red;'>Keine Lagerorte gefunden.</p>" );
            }
            if (displayAs == "1") {
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
        this.getFreePlaces(0);
    }
    exportFreePlacesAsPDF() {
        var doc = new jsPDF('p', 'pt');
        var columns = ["StorageLocationId", "StorageLocationName"];
        var rows = [];
        var x = 0;
        var pg = 1;
        $.each(this.getFreePlaces(2), (pos, row)=>{
            rows[x] = row;
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
        $.each(this.getFreePlaces("2"), (key, place)=>{
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