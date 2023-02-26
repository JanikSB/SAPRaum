sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    "sap/ui/unified/CalendarAppointment"
], function(Controller, JSONModel, MessageToast, CalendarAppointment) {
    'use strict';

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

        onAfterRendering(){
          this.addApps();
        },

        addApps(){
          var oPlanningCalendar = this.byId("raumKalender");

          var oRowsLoadedPromise = new Promise(function(resolve, reject) {
            var oRowsBinding = oPlanningCalendar.getBinding("rows");
            oRowsBinding.attachDataReceived(function() {
                resolve();
            });
          });

          oRowsLoadedPromise.then(function() {
            oModel.read("/BOOKINGS", {
                success: function(oData) {
                    var aAppointments = oData.results;
                    var aRows = oPlanningCalendar.getRows();
                    for (var i = 0; i < aAppointments.length; i++) {
                        var oAppointment = aAppointments[i];
                        for (var j = 0; j < aRows.length; j++) {
                            var oRow = aRows[j];
                            var oBindingContext = oRow.getBindingContext("Model");
                            var sRowRaumnummer = oBindingContext.getProperty("raumnummer");
                            if (oAppointment.raumnummer === sRowRaumnummer) {
                                var oNewAppointment = new CalendarAppointment({
                                    startDate: oAppointment.datetimefrom,
                                    endDate: oAppointment.datetimeto,
                                    title: oAppointment.bookername
                                });
                                oRow.addAppointment(oNewAppointment);
                                break;
                            }
                        }
                    }
                    oPlanningCalendar.invalidate();
                },
                error: function(oError) {
                    console.log("Error reading appointments data: " + oError);
                }
            });
          })
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
    });
});