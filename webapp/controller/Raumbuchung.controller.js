sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    "sap/ui/core/EventBus"
], function(Controller, JSONModel, MessageToast, EventBus) {
    'use strict';

    // var calendarList = [];
    // var omodel;
    // var newBookingId;
    // var that;

    var oModel;
    var oContext;
    var that;
    var bookings;

    var newId,
    localName,
    from,
    to,
    room;


    return Controller.extend('raumreservierung.controller.Raumbuchung', {

        onInit(){
          oModel = this.getOwnerComponent().getModel('Model');
          that = this;
          var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);
          var test = oStore.get(('logUser'));
          var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          if(!test){
            oRouter.navTo('anmeldung');
          }else{
            localName = oStore.get('logUser').username;
          }
          

          this.minDateDatePicker();
          this.getNewId();
        },


        bookRoom(){
          var selection = this.getSelections();
          this.getBookings().then(function(data){
          var roomFree = that.verifyBooking(selection, data);

          if(roomFree){
            that.bookingInModel();
            roomFree = false;
          }
          })
        },



        getSelections(){
          var selection = [];
          
          var selectRoom = this.byId('selectRaum')
          ,selectDateFrom = this.byId('selectVon')
          ,selectDateTo = this.byId('selectBis');

          var roomNumber = selectRoom.getSelectedItem().getText().substring(5)
          ,dateFrom = new Date(selectDateFrom.getValue())
          ,dateTo = new Date(selectDateTo.getValue()),

          dateFromTime = dateFrom.getTime(),
          dateToTime = dateTo.getTime();

          if(dateFromTime && dateToTime){
            //exception between both picked times
            if(dateFromTime < dateToTime || dateFromTime > new Date()){
              selection.push(roomNumber, dateFrom, dateTo);
            }else{
              MessageToast.show('Fehler: Überprüfe ausgewählte Zeiten');
            }
          } else{
            MessageToast.show('Bitte Zeiten auswählen')
          }

          return selection;
        },

        

        verifyBooking(selection, data){
          var roomFree;

          var selRoom = selection[0],
          selDateFrom = selection[1],
          selDateTo = selection[2];


          roomFree = true;
          bookings= data.results;

          for(var i=0; i<bookings.length; i++){
            let existingRoom = bookings[i].raumnummer
            let existingDateFrom = bookings[i].datetimefrom.getTime();
            let existingDateTo =bookings[i].datetimeto.getTime();

            if(selRoom == existingRoom){
              if(selDateFrom.getTime() == existingDateFrom ||
              selDateTo.getTime() == existingDateTo ||
              ((selDateFrom.getTime() > existingDateFrom) && (selDateFrom.getTime() < existingDateTo)) ||
              ((selDateTo.getTime() > existingDateFrom) && (selDateTo.getTime() < existingDateTo))) {

                roomFree = false;
              }
            }
          }

          if(roomFree == false){
            MessageToast.show('Raum zu dieser Zeit bereits belegt')
          }else{
            from = selDateFrom;
            to = selDateTo;
            room = selRoom;
          }

          return roomFree; 
        },

        bookingInModel(){
          oContext = oModel.createEntry('BOOKINGS');

          console.log('booking in model')
          oModel.setProperty('bookingid', newId, oContext);
          oModel.setProperty('bookername', localName, oContext);
          oModel.setProperty('raumnummer', room, oContext);
          oModel.setProperty('datetimefrom', from, oContext);
          oModel.setProperty('datetimeto', to, oContext);

          oModel.submitChanges();

          MessageToast.show('Buchung erfolgreich!');
          newId ++;

        },

        getBookings(){
          return new Promise((resolve, reject) => {
            oModel.read("/BOOKINGS", {
                success: function (oData) {
                    resolve(oData)              
                },
                error: function (oError) {            
                    reject(oError);
                }
            });       
          })
        },



        minDateDatePicker(){
          var pickerVon = this.byId('selectVon'),
          pickerBis = this.byId('selectBis');
          var timeVon;

          
          pickerVon.setMinDate(new Date());
          timeVon = new Date().getTime() + 3600000;
          pickerBis.setMinDate(new Date(timeVon));
        },

        onSelectVon(){
          var pickerVon = this.byId('selectVon'),
          pickerBis = this.byId('selectBis');

          var timeVon = pickerVon.getDateValue(),
          minTimeBis;

          if(!pickerBis.getDateValue()){
            minTimeBis = new Date(pickerVon.getDateValue().getTime() + 3600000);
            pickerBis.setMinDate(new Date(minTimeBis));
            pickerBis.setValue('');
          }
          else if((pickerBis.getDateValue().getTime() <= timeVon.getTime())){
            minTimeBis = new Date(pickerVon.getDateValue().getTime() + 3600000);
            pickerBis.setMinDate(new Date(minTimeBis));
            pickerBis.setValue('');
          } else{
            minTimeBis = new Date(pickerVon.getDateValue().getTime() + 3600000);
            pickerBis.setMinDate(new Date(minTimeBis));
          }
        },

        getNewId(){
         
          oModel.read('/BOOKINGS', {
            success: function(data){
              newId = data.results[data.results.length-1].bookingid + 1
            },
            error: function (oError) {            
                console.log(oError);
            }
          })
        }
        
        // onInit(){
        //     var oSelect = this.byId('selectRaum');
        //     oSelect.setColumnRatio('1:4');

        //     omodel = this.getOwnerComponent().getModel('Model');
        //     that = this;

        //     var promise = [];
        //     promise.push(this.readRooms(omodel));
        //     promise.push(this.readBookings(omodel));

        //     Promise.all(promise).then(function(data){
                

        //         that.populateRooms(data[0]);
        //         that.populateBookings(data[1]);

        //         var newModel = new JSONModel();
        //         newModel.setData(calendarList);
        //         that.getView().setModel(newModel);
                
        //     }).catch(function(error){
        //     });
        // },



        // //FUNKTIONEN UM DATEN AUSZULESEN UND ZU SPEICHERN
        // //buchungen aus db auslesen und in model laden
        // readBookings(omodel) {
        //     return new Promise(function (resolve, reject) {
        //         omodel.read("/BOOKINGS", {
        //             success: function (oData) {
        //                 var oBookings = oData.results;

        //                 resolve(oBookings);

        //                 if(oBookings.length == 0){
        //                     newBookingId = 1;
        //                 }else{
        //                     let lastBooking = oBookings[oBookings.length - 1];
        //                     newBookingId = lastBooking.bookingid + 1;
        //                 }
                        
        //             },
        //             error: function (oError) {            
        //                 reject(oError);
        //             }
        //         });       
        //     });    
        // },

        // //raeume aus db auslesen und in model laden
        // readRooms(omodel) {
        //     return new Promise(function (resolve, reject) {
        //         omodel.read("/ROOMS", {
        //             success: function (oData) {
                        
        //                 resolve(oData.results);

        //             },
        //             error: function (oError) {            
        //                 reject(oError);
        //             }
        //         });       
        //     });    
        // },

        // //raeume aus model auslesen und in array calendarList speichern
        // populateRooms(roomData){
            
        //     for (var i = 0; i < roomData.length; i++){
        //         calendarList[i] = {
        //             roomnumber: roomData[i].raumnummer,
        //             bookings: []
        //         }
        //     }
        // },

        // //buchungen aus mdel auslesen und in array calendarList speichern
        // populateBookings(bookingData){

        //     var bookingObject = {};

        //     for (var i = 0; i < bookingData.length; i++){
                

        //         var dateTo = new Date(bookingData[i].datetimeto);
        //         var dateFrom = new Date(bookingData[i].datetimefrom)

        //         if(bookingData[i].raumnummer == 1){
        //             bookingObject = {
        //                 start: dateFrom,
        //                 end: dateTo,
        //                 booker: bookingData[i].bookername
        //             }

        //             calendarList[0].bookings.push(bookingObject);

                    
        //         } else if(bookingData[i].raumnummer == 2){
        //             bookingObject = {
        //                 start: dateFrom,
        //                 end: dateTo,
        //                 booker: bookingData[i].bookername
        //             }

        //             calendarList[1].bookings.push(bookingObject);

        //         } else if(bookingData[i].raumnummer == 3){
        //             bookingObject = {
        //                 start: dateFrom,
        //                 end: dateTo,
        //                 booker: bookingData[i].bookername
        //             }

        //             calendarList[2].bookings.push(bookingObject);
        //         }

        //     }

        //     console.log(calendarList);
        // },



        // //BUCHUNGSFUNKTIONEN:
        // //werte von den buchungskomponenten auslesen, abgleichen und in model(DB) schreiben
        // bookRoom () {
        //     var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);
        //     var localName = oStore.get('logUser').username;

        //     //daten aus Auswahl
        //     var room = this.byId('selectRaum').getSelectedItem().getText().substring(5);
        //     var dateTimeFrom = new Date(this.byId('selectVon').getValue());
        //     var dateTimeTo = new Date(this.byId('selectBis').getValue());
        //     var selecterWork = this.byId('selectArbeit')

        //     //checker value to verify if room free
        //     var roomFree;

        //     var newModel = this.getView().getModel();
        //     var currentData = newModel.getData();
            
        //     var oContext = omodel.createEntry('BOOKINGS');
        //     var promise = [];
        

        //     //if zeiten ausgewaehlt
        //     if (dateTimeFrom.getTime() === dateTimeFrom.getTime() && dateTimeTo.getTime() === dateTimeTo.getTime()){
        //         console.log('zeit auswahl erfolgreich')

        //         roomFree = this.verifyBooking(dateTimeFrom, dateTimeTo, room);

        //         //wenn raeume frei sind (in funktion 'verify booking' gecheckt)
        //         if(roomFree){
        //             //Arbeitsauswahl pruefen
        //             var selectedWork;
        //             if(selecterWork.getEnabled()){
        //                 selectedWork = selecterWork.getSelectedItem().getText();
        //                 console.log(selecterWork.getSelectedItem().getText() + ': mit Arbeitsauswahl buchen');   
        //             }

        //             //Buchung in DB hinzufuegen:
        //             promise.push(that.populateModel(omodel, newBookingId, localName, room, dateTimeFrom, dateTimeTo, oContext));

        //             Promise.all(promise).then(() => {
        //                 var oEventBus = sap.ui.getCore().getEventBus();
        //                 oEventBus.publish('channel1', 'event1');


        //                 MessageToast.show('Erfolgreich gebucht!')

        //                 newBookingId++;

        //                 let newBookingData = {
        //                     start: dateTimeFrom,
        //                     end: dateTimeTo,
        //                     booker: localName
        //                 }

        //                 for (let i=0; i<currentData.length; i++){
        //                     if(currentData[i].roomnumber === room){
        //                         currentData[i].bookings.push(newBookingData);
        //                         break;
        //                     } 
        //                 }

        //                 newModel.setData(currentData);
        //                 this.getView().setModel(newModel)
        //             })

                    

        //         }else {
        //             MessageToast.show('Raum zu dieser Zeit bereits gebucht')
        //         }

        //     } else {
        //         MessageToast.show('Bitte Datum und Zeit auswählen')
        //     }
        // },

        // //ausgewaehlte zeiten abgleichen und bool roomFree zurueckgeben
        // verifyBooking(selectedDateFrom, selectedDateTo, roomNumberString){
        //     //return value
        //     var roomFree = true

        //     //new booking values
        //     var dateFrom = selectedDateFrom.getTime();
        //     var dateTo = selectedDateTo.getTime();

        //     //existing bookings values
        //     var newModel = this.getView().getModel();
        //     var currentData = newModel.getData();
        
            
        //     for(let i = 0; i < currentData[roomNumberString - 1].bookings.length; i++){
        //         let existingDateFrom = currentData[roomNumberString-1].bookings[i].start.getTime();
        //         let existingDateTo =currentData[roomNumberString-1].bookings[i].end.getTime();

        //         if(dateFrom == existingDateFrom ||
        //              dateTo == existingDateTo ||
        //               ((dateFrom > existingDateFrom) && (dateFrom < existingDateTo)) ||
        //                ((dateTo > existingDateFrom) && (dateTo < existingDateTo))) {
        //             roomFree = false;
        //             console.log('raum zu der zeit belegt: if abfrage')
        //         } 
        //     }
        //     return roomFree;
        // },

        // //KALENDAR FUNKTIONEN
        // populateModel(omodel, newBookingId, localName, room, dateTimeFrom, dateTimeTo, oContext){
        //     omodel.setProperty('bookingid', newBookingId, oContext);
        //     omodel.setProperty('bookername', localName, oContext);
        //     omodel.setProperty('raumnummer', room, oContext);
        //     omodel.setProperty('datetimefrom', dateTimeFrom, oContext);
        //     omodel.setProperty('datetimeto', dateTimeTo, oContext);

        //     omodel.submitChanges();
        // },

        // //NEBENFUNKTIONEN
        // //switch status auf selectArbeit uebertragen (on/ off)
        // switch(oEvent) {
        //     var state = oEvent.getParameter('state');
        //     var selectWork = this.byId('selectArbeit');

        //     selectWork.setEnabled(state);
        // }


		
    });
});