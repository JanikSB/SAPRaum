sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/m/MessageToast',
    "sap/ui/core/format/DateFormat",

    'sap/m/ColumnListItem',
    'sap/m/Text',
    'sap/m/ObjectIdentifier'
], function (Controller, Filter, FilterOperator, MessageToast, DateFormat, ColumnListItem, Text, ObjectIdentifier) {
    'use strict';


    var localName;
    var that;



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
            // this.readBookings();
            this.bindItems();
        },

        bindItems(){
            var oTable = this.getView().byId('myTable');
            oTable.bindItems({
                path: 'Model>/BOOKINGS',
                filters: [
                    new Filter('bookername', FilterOperator.EQ, localName)
                ],
                
                template: new ColumnListItem({
                    cells: [
                        new ObjectIdentifier({
                            title: '{Model>raumnummer}'
                        }),
                        
                        new Text({
                            text:{parts: [{path: 'Model>datetimefrom'}],
                                formatter: that.dateFormatter.bind(this)
                            }
                        }),

                        new Text({
                            text:{parts: [{path: 'Model>datetimeto'}],
                                formatter: that.dateFormatter.bind(this)
                            }
                        }),

                        new Text({
                            text:
                            {parts: ['Model>datetimefrom', 'Model>datetimeto'],
                            formatter: (datetimefrom, datetimeto) => {
                                return that.statusFormatter(datetimefrom, datetimeto);
                            }}
                        }),

                        new Text({
                            text: '{Model>bookingid}'
                        })
                    ]
                })
            })
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
                oBinding = oTable.getBinding("items"),
                aFilters = [];

            if (aSelectedItems.length > 0) {
                for (var i = 0; i < aSelectedItems.length; i++) {
                    var sKey = aSelectedItems[i].getKey();
                    if (sTitle === "Raumnummer") {
                        aFilters.push(new sap.ui.model.Filter("raumnummer", "EQ", sKey));
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
            var test = oTable.getBinding('items').getContexts();

            var aSelectedItems = oTable.getSelectedItems();

            
            //check ob eine Buchung ausgewaehlt wurde
            if(aSelectedItems.length > 0){

                //durch ausgewaehlte buchungen loopen und loeschen
                for(var i= 0; i < aSelectedItems.length; i++){
                    let oSelectedItem = aSelectedItems[i];
                    let aCells = oSelectedItem.getCells();
                    let sBookingId = aCells[4].getText();

                    //booking aus model entfernen
                    model.remove(`/BOOKINGS(${sBookingId})`, {
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