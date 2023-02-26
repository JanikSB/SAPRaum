sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/m/MessageToast',
    "sap/ui/core/format/DateFormat",


    "sap/ui/commons/Label",
    "sap/ui/commons/TextView",
    "sap/ui/table/Column"
], function (Controller, Filter, FilterOperator, MessageToast, DateFormat, Label, TextView, Column) {
    'use strict';


    var localName;
    var that;
    var oModel;



    return Controller.extend('raumreservierung.controller.MeineBuchung', {

        onInit() {
            that = this;

            //userdaten aus local storage auslesen (vom eingelogten user)
            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            localName = oStore.get('logUser').username;

            if(!localName){
                oRouter.navTo('anmeldung');
              }

            //odata model auslesen
            this.readBookings();
        },


        //tabelle mit eigenen buchungen fuellen
        readBookings(){

            var oTable = this.getView().byId('myTable');

            oTable.bindRows({
                path: "Model>/BOOKINGS",
                //set the filter for the bookername property
                filters: [
                    new Filter("bookername", FilterOperator.EQ, localName)
                ],
                parameters: {
                    //set the count mode to inline to get the number of records for paging
                    countMode: 'Inline'
                }
            });

            oTable.addColumn(new Column({
                label: new Label({text: "Raumnummer"}),
                template: new TextView({
                    text: '{Model>raumnummer}'})
            }));
            
            //add a column for the 'datetimefrom' property
            oTable.addColumn(new Column({
                label: new Label({text: "Von"}),
                template: new TextView({
                    text: 
                    {parts: [{path: 'Model>datetimefrom'}],
                    formatter: that.dateFormatter.bind(this)
                }})
            }));
            
            //add a column for the 'datetimeto' property
            oTable.addColumn(new Column({
                label: new Label({text: "Bis"}),
                template: new TextView({
                    text: 
                    {parts: [{path: 'Model>datetimeto'}],
                    formatter: that.dateFormatter.bind(this)
                }})
            }));

            oTable.addColumn(new Column({
                label: new Label({text: 'Status'}),
                template: new TextView({
                    text:
                    {parts: ['Model>datetimefrom', 'Model>datetimeto'],
                    formatter: (datetimefrom, datetimeto) => {
                        return that.statusFormatter(datetimefrom, datetimeto);
                    }
                }})
            }))

            oTable.addColumn(new Column({
                label: new Label({text: 'Buchungsnummer'}),
                template: new TextView({
                    text: '{Model>bookingid}'}),
                visible: false
            }))
        },

        //datum zu lesbarem string formattieren
        dateFormatter(date){
            const format = DateFormat.getDateTimeInstance({pattern: "dd.MM.yyyy HH:mm"});
            var strDate = format.format(new Date(date));
            return strDate;
        },

        //status aus datetimefrom und datetimeto erschliessen
        statusFormatter(dateFrom, dateTo){
            var status;

            var now = new Date();
            if (now >= dateFrom && now <= dateTo) {
                status = 'läuft'
            } else if (now < dateFrom) {
                status = 'gebucht'
            } else if (now > dateTo) {
                status = 'abgelaufen'
            }


            return status;
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
                    } 

                    //STATUS AENDERN -----------------------------------------
                    else if (sTitle === "Status") {
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
            var model = that.getOwnerComponent().getModel('Model');          

            var oTable = this.byId('myTable');
            var selectedBookingsIndices = oTable.getSelectedIndices();

            
            //check ob eine Buchung ausgewaehlt wurde
            if(selectedBookingsIndices.length > 0){

                //durch ausgewaehlte buchungen loopen und loeschen
                for(var i= 0; i < selectedBookingsIndices.length; i++){
                    let oContext = oTable.getContextByIndex(selectedBookingsIndices[i])
                    let object = oContext.getObject();

                    let booking = object.bookingid;

                    //booking aus model entfernen
                    model.remove(`/BOOKINGS(${booking})`, {
                        method: 'DELETE',
                        success: (data) => {
                            console.log('erfolreich aus model geloescht');
                        },
                        error: (e) => {
                            console.log('fehler beim loeschen aus model')
                        }
                    })
                };


            } else{
                MessageToast.show('Keine Buchung ausgewählt')
            }

            
        }

    })
})