sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    "sap/ui/core/EventBus"
], function(Controller, JSONModel, MessageToast, EventBus) {
    'use strict';

    var calendarList = [];
    var omodel;
    var newBookingId;
    var that;


    return Controller.extend('raumreservierung.controller.Raumbuchung', {
        
        onInit(){
            var oSelect = this.byId('selectRaum');
            oSelect.setColumnRatio('1:4');

            omodel = this.getOwnerComponent().getModel('Model');
            that = this;

            var promise = [];
            promise.push(this.readRooms(omodel));
            promise.push(this.readBookings(omodel));

            Promise.all(promise).then(function(data){
                

                that.populateRooms(data[0]);
                that.populateBookings(data[1]);

                var newModel = new JSONModel();
                newModel.setData(calendarList);
                that.getView().setModel(newModel);
                
            }).catch(function(error){
            });
        },



        //FUNKTIONEN UM DATEN AUSZULESEN UND ZU SPEICHERN
        //buchungen aus db auslesen und in model laden
        readBookings(omodel) {
            return new Promise(function (resolve, reject) {
                omodel.read("/BOOKINGS", {
                    success: function (oData) {
                        var oBookings = oData.results;

                        resolve(oBookings);

                        if(oBookings.length == 0){
                            newBookingId = 1;
                        }else{
                            let lastBooking = oBookings[oBookings.length - 1];
                            newBookingId = lastBooking.bookingid + 1;
                        }
                        
                    },
                    error: function (oError) {            
                        reject(oError);
                    }
                });       
            });    
        },

        //raeume aus db auslesen und in model laden
        readRooms(omodel) {
            return new Promise(function (resolve, reject) {
                omodel.read("/ROOMS", {
                    success: function (oData) {
                        
                        resolve(oData.results);

                    },
                    error: function (oError) {            
                        reject(oError);
                    }
                });       
            });    
        },

        //raeume aus model auslesen und in array calendarList speichern
        populateRooms(roomData){
            
            for (var i = 0; i < roomData.length; i++){
                calendarList[i] = {
                    roomnumber: roomData[i].raumnummer,
                    bookings: []
                }
            }
        },

        //buchungen aus mdel auslesen und in array calendarList speichern
        populateBookings(bookingData){

            var bookingObject = {};

            for (var i = 0; i < bookingData.length; i++){
                

                var dateTo = new Date(bookingData[i].datetimeto);
                var dateFrom = new Date(bookingData[i].datetimefrom)

                if(bookingData[i].raumnummer == 1){
                    bookingObject = {
                        start: dateFrom,
                        end: dateTo,
                        booker: bookingData[i].bookername
                    }

                    calendarList[0].bookings.push(bookingObject);

                    
                } else if(bookingData[i].raumnummer == 2){
                    bookingObject = {
                        start: dateFrom,
                        end: dateTo,
                        booker: bookingData[i].bookername
                    }

                    calendarList[1].bookings.push(bookingObject);

                } else if(bookingData[i].raumnummer == 3){
                    bookingObject = {
                        start: dateFrom,
                        end: dateTo,
                        booker: bookingData[i].bookername
                    }

                    calendarList[2].bookings.push(bookingObject);
                }

            }

            console.log(calendarList);
        },



        //BUCHUNGSFUNKTIONEN:
        //werte von den buchungskomponenten auslesen, abgleichen und in model(DB) schreiben
        bookRoom () {
            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            var localName = oStore.get('logUser').username;

            //daten aus Auswahl
            var room = this.byId('selectRaum').getSelectedItem().getText().substring(5);
            var dateTimeFrom = new Date(this.byId('selectVon').getValue());
            var dateTimeTo = new Date(this.byId('selectBis').getValue());
            var selecterWork = this.byId('selectArbeit')

            //checker value to verify if room free
            var roomFree;

            var newModel = this.getView().getModel();
            var currentData = newModel.getData();
            
            var oContext = omodel.createEntry('BOOKINGS');
        

            //if zeiten ausgewaehlt
            if (dateTimeFrom.getTime() === dateTimeFrom.getTime() && dateTimeTo.getTime() === dateTimeTo.getTime()){
                console.log('zeit auswahl erfolgreich')

                roomFree = this.verifyBooking(dateTimeFrom, dateTimeTo, room);

                //wenn raeume frei sind (in funktion 'verify booking' gecheckt)
                if(roomFree){
                    //Arbeitsauswahl pruefen
                    var selectedWork;
                    if(selecterWork.getEnabled()){
                        selectedWork = selecterWork.getSelectedItem().getText();
                        console.log(selecterWork.getSelectedItem().getText() + ': mit Arbeitsauswahl buchen');   
                    }

                    //Buchung in DB hinzufuegen:
                    omodel.setProperty('bookingid', newBookingId, oContext);
                    omodel.setProperty('bookername', localName, oContext);
                    omodel.setProperty('raumnummer', room, oContext);
                    omodel.setProperty('datetimefrom', dateTimeFrom, oContext);
                    omodel.setProperty('datetimeto', dateTimeTo, oContext);

                    omodel.submitChanges();

                    var oEventBus = sap.ui.getCore().getEventBus();
                    oEventBus.publish('channel1', 'event1');


                    MessageToast.show('Erfolgreich gebucht!')

                    newBookingId++;

                    let newBookingData = {
                        start: dateTimeFrom,
                        end: dateTimeTo,
                        booker: localName
                    }

                    for (let i=0; i<currentData.length; i++){
                        if(currentData[i].roomnumber === room){
                            currentData[i].bookings.push(newBookingData);
                            break;
                        } 
                    }

                    newModel.setData(currentData);
                    this.getView().setModel(newModel)

                }else {
                    MessageToast.show('Raum zu dieser Zeit bereits gebucht')
                }

            } else {
                MessageToast.show('Bitte Datum und Zeit auswählen')
            }
        },

        //ausgewaehlte zeiten abgleichen und bool roomFree zurueckgeben
        verifyBooking(selectedDateFrom, selectedDateTo, roomNumberString){
            //return value
            var roomFree = true

            //new booking values
            var dateFrom = selectedDateFrom.getTime();
            var dateTo = selectedDateTo.getTime();

            //existing bookings values
            var newModel = this.getView().getModel();
            var currentData = newModel.getData();
        
            
            for(let i = 0; i < currentData[roomNumberString - 1].bookings.length; i++){
                let existingDateFrom = currentData[roomNumberString-1].bookings[i].start.getTime();
                let existingDateTo =currentData[roomNumberString-1].bookings[i].end.getTime();

                if(dateFrom == existingDateFrom ||
                     dateTo == existingDateTo ||
                      ((dateFrom > existingDateFrom) && (dateFrom < existingDateTo)) ||
                       ((dateTo > existingDateFrom) && (dateTo < existingDateTo))) {
                    roomFree = false;
                    console.log('raum zu der zeit belegt: if abfrage')
                } 
            }
            return roomFree;
        },

        //KALENDAR FUNKTIONEN
        populateCalendar(){
            
        },

        //NEBENFUNKTIONEN
        //switch status auf selectArbeit uebertragen (on/ off)
        switch(oEvent) {
            var state = oEvent.getParameter('state');
            var selectWork = this.byId('selectArbeit');

            selectWork.setEnabled(state);
        }


		
    });
});