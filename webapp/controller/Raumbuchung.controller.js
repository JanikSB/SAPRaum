sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast'
], function(Controller, JSONModel, MessageToast) {
    'use strict';

    var calendarList = [];
    var omodel;
    var newBookingId;


    return Controller.extend('raumreservierung.controller.Raumbuchung', {
        
        onInit(){
           var oSelect = this.byId('selectRaum');
           oSelect.setColumnRatio('1:4');

           omodel = this.getOwnerComponent().getModel('Model');

        //    omodel.read('/ROOMS', {

        //         success: function (res) {
        //             var odatares = res.results;

        //             object.populateRooms(odatares);

                    
        //         }
        //     })

            // omodel.read('/BOOKINGS', {

            //     success: function (res) {
            //         var odatares = res.results;

            //         object.populateBookings(odatares);

                    

            //     }
            // })
            // this.readRooms().then(function (data){
            //     return that.readBookings();
            // }).then(function(data){

                
            // }).catch(function(error){
                
            // })
            var that = this;

            var promise = [];
            promise.push(this.readRooms(omodel));
            promise.push(this.readBookings(omodel));

            Promise.all(promise).then(function(data){
                

                that.populateRooms(data[0]);
                that.populateBookings(data[1]);

                var newModel = new JSONModel();
                newModel.setData(calendarList);
                that.getView().setModel(newModel);


                // var newModel = new JSONModel();
                // newModel.setData(calendarList);
                // that.getView().setModel(newModel, 'data');

                // console.log(that.getView().getModel('data').getData());
                
            }).catch(function(error){
            });


            
            
        },

        //buchungen aus db auslesen und in model laden
        readBookings(omodel) {
            return new Promise(function (resolve, reject) {
                omodel.read("/BOOKINGS", {
                    success: function (oData) {
                        var oBookings = oData.results;

                        resolve(oBookings);

                        let lastBooking = oBookings[oBookings.length - 1];
                        newBookingId = lastBooking.bookingid + 1;
                    },
                    error: function (oError) {            
                        reject(oError);
                    }
                });       
            });    
        },

        //FUNKTIONEN UM DATEN AUSZULESEN UND SPEICHERN
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
            var selecterRoom = this.byId('selectRaum');
            var selecterFrom = this.byId('selectVon');
            var selecterTo = this.byId('selectBis');
            var selecterWork = this.byId('selectArbeit')

            var room = selecterRoom.getSelectedItem().getText();
            var dateTimeFrom = selecterFrom.getValue();
            var dateTimeTo = selecterTo.getValue();
            var roomFree;

            omodel = this.getOwnerComponent().getModel('Model');

            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            var localName = oStore.get('logUser').username;
            var oContext = omodel.createEntry('BOOKINGS');

            var that = this;
            

            console.log(room)
            console.log(dateTimeFrom)
            console.log(dateTimeTo)

            var dateFrom = new Date(dateTimeFrom);
            var dateTo = new Date(dateTimeTo);
        

            //wenn zeiten ausgewaehlt
            if (dateTimeFrom && dateTimeTo){
                console.log('zeit ausgewaehlt')
                roomFree = this.verifyBooking(dateTimeFrom, dateTimeTo, room);

                //wenn raeume frei sind (in funktion 'verify booking' gecheckt)
                if(roomFree){
                    var selectedWork;
                    if(selecterWork.getEnabled()){

                        selectedWork = selecterWork.getSelectedItem().getText();
                        console.log(selecterWork.getSelectedItem().getText() + ': mit Arbeitsauswahl buchen')

                        //spalte in DB hinzufuegen:
                             //omodel.setProperty('work', selectedWork, oContext);
                    }
                    omodel.setProperty('bookingid', newBookingId, oContext);
                    omodel.setProperty('bookername', localName, oContext);
                    omodel.setProperty('raumnummer', room.substring(5), oContext);
                    omodel.setProperty('datetimefrom', dateFrom, oContext);
                    omodel.setProperty('datetimeto', dateTo, oContext);

                    omodel.submitChanges();

                    MessageToast.show('Erfolgreich gebucht!')
                    location.reload();
                }else {
                    MessageToast.show('Raum zu dieser Zeit bereits gebucht')
                }

            } else {
                MessageToast.show('Bitte Datum und Zeit auswählen')
            }
        },

        //ausgewaehlte zeiten abgleichen und bool roomFree zurueckgeben
        verifyBooking(dateFromString, dateToString, roomNumberString){

            var dateFrom = new Date(dateFromString);
            var dateTo = new Date(dateToString);
            var roomNumber = roomNumberString.substring(5);
            var roomFree = true

        
            
            //if condition ueberarbeiten
            for(let i = 0; i < calendarList[roomNumber - 1].bookings.length; i++){
                var calendarDateFrom = new Date(calendarList[roomNumber - 1].bookings[i].start);
                var calendarDateTo = new Date(calendarList[roomNumber - 1].bookings[i].end)

                if(dateFrom == calendarDateFrom ||
                     dateTo == calendarDateTo ||
                      ((dateFrom > calendarDateFrom) && (dateFrom < calendarDateTo)) ||
                       ((dateTo > calendarDateFrom) && (dateTo < calendarDateTo))) {
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