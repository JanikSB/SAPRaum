sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    "sap/ui/core/EventBus"
], function (Controller, JSONModel, MessageToast, EventBus) {
    'use strict';


    var localName;
    var that;



    return Controller.extend('raumreservierung.controller.MeineBuchung', {
        readBookings(){
            var newModel = new JSONModel();

            var omodel = this.getOwnerComponent().getModel('Model');

            omodel.read('/BOOKINGS', {
                filters: [
                    new sap.ui.model.Filter({
                        path: "bookername",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: localName
                    })
                ],

                success: function (res) {
                    var odatares = res.results;

                    console.log(odatares)

                    //neues array mit formattierten omodel daten erstellt
                    var newArray = that.bookingDateFormatter(odatares)

                    //array als model festlegen
                    newModel.setData(newArray);

                    that.getView().setModel(newModel)
                }
            })
        },


        onInit() {

            that = this;

            

            //userdaten aus local storage auslesen (vom eingelogten user)
            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            localName = oStore.get('logUser').username;

            //odata model auslesen
            this.readBookings();
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("channel1", "event1", this.readBookings, this);
        },



        //Buchungen dates zu strings & status erstellen
        bookingDateFormatter(bookingObjectArray) {

            var timeFromOld;
            var timeToOld;

            var dateString;
            var timeString;

            var roomnumber;
            var timeFromNew;
            var timeToNew;
            var status;

            var newObjectArray = [];

            for (var i = 0; i < bookingObjectArray.length; i++) {

                //zeit von & zeit bis vom odata model auslesen
                timeFromOld = new Date(bookingObjectArray[i].datetimefrom);
                timeToOld = new Date(bookingObjectArray[i].datetimeto);

                //dates zu strings formattieren
                dateString = timeFromOld.toLocaleDateString();
                timeString = timeFromOld.toLocaleTimeString();

                timeFromNew = dateString + ' ' + timeString;

                dateString = timeToOld.toLocaleDateString();
                timeString = timeToOld.toLocaleTimeString();

                timeToNew = dateString + ' ' + timeString;


                //status anhand der zeit erstellen
                var now = new Date();
                if (now >= timeFromOld && now <= timeToOld) {
                    status = 'läuft'
                } else if (now < timeFromOld) {
                    status = 'gebucht'
                } else if (now > timeToOld) {
                    status = 'abgelaufen'
                }

                roomnumber = bookingObjectArray[i].raumnummer


                //neues objekt erstellen und im array (neues model) speichern
                newObjectArray[i] = {
                    raumnummer: roomnumber,
                    dateFrom: timeFromNew,
                    dateTo: timeToNew,
                    status: status
                }
            }
            return newObjectArray;
        },



        //Buchungen filtern (status, raumnummer)
        onFilter (oEvent) {

            var oSource = oEvent.getSource(),
                aSelectedItems = oSource.getSelectedItems(),
                sTitle = oSource.getTitle(),
                oTable = this.byId("myTable"),
                oBinding = oTable.getBinding("rows"),
                aFilters = [];

            if (aSelectedItems.length > 0) {
                for (var i = 0; i < aSelectedItems.length; i++) {
                    var sKey = aSelectedItems[i].getKey();
                    if (sTitle === "Raumnummer") {
                        aFilters.push(new sap.ui.model.Filter("raumnummer", "EQ", sKey));
                    } else if (sTitle === "Status") {
                        aFilters.push(new sap.ui.model.Filter("status", "EQ", sKey));
                    }
                }
                // filters beim tabellen binding anwenden
                oBinding.filter(aFilters);
            } else {
                oBinding.filter([]);
            }
        },


        //Buchung löschen/ stornieren
        onCancelBooking(){
            var model = this.getView().getModel();

            var oTable = this.byId('myTable');
            var selectedBooking = oTable.getSelectedIndices();

            var firstLoop = true;

            //check ob eine Buchung ausgewaehlt wurde
            if(selectedBooking.length > 0){

                //die ausgewahlten buchungen in der tabelle und dem model wiederfinden und herausloschen
                for(let i = 0; i < selectedBooking.length; i++){

                    if(firstLoop){
                        var selectedContext = oTable.getContextByIndex(selectedBooking[i]);
                        firstLoop = false;
                    }else {
                        var selectedContext = oTable.getContextByIndex(selectedBooking[i-1]);
                    }
                    
                    var selectedData = selectedContext.getObject();
                
                    var aData = model.getData();
                    var index = aData.indexOf(selectedData);
                    aData.splice(index, 1);
                    model.setData(aData)
                    oTable.getBinding('rows').refresh();


                    //FEHLT: daten auch aus globalem model loeschen
                }
            } else{
                MessageToast.show('Keine Buchung ausgewählt')
            }

            
        }

    })
})