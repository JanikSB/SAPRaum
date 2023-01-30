sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel'
], function(Controller, JSONModel) {
    'use strict';


    var localName;

    

    return Controller.extend('raumreservierung.controller.MeineBuchung', {




        onInit(){

            var object = this;

            var newModel = new JSONModel();


            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            localName = oStore.get('logUser').username;

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

                    var newArray = object.bookingDateFormatter(odatares)

                    newModel.setData(newArray);
                    
                    object.getView().setModel(newModel)
                }
            })
        },

        bookingDateFormatter(bookingObjectArray){
              

            var timeFromOld;
            var timeToOld;

            var dateString;
            var timeString;
            
            var roomnumber;
            var timeFromNew;
            var timeToNew;
            var status;

            var newObjectArray = [];

            
            for (var i = 0; i < bookingObjectArray.length; i++){

                timeFromOld = new Date(bookingObjectArray[i].datetimefrom);
                timeToOld = new Date(bookingObjectArray[i].datetimeto);

                dateString = timeFromOld.toLocaleDateString();
                timeString = timeFromOld.toLocaleTimeString();

                timeFromNew = dateString + ' ' + timeString;

                dateString = timeToOld.toLocaleDateString();
                timeString = timeToOld.toLocaleTimeString();

                timeToNew = dateString + ' ' + timeString;

                var now = new Date();
                if (now >= timeFromOld && now <= timeToOld){
                    status = 'läuft'
                } else if (now < timeFromOld){
                    status = 'gebucht'
                } else if ( now > timeToOld){
                    status = 'abgelaufen'
                }

                roomnumber = bookingObjectArray[i].raumnummer

                newObjectArray[i] = {
                    raumnummer: roomnumber,
                    dateFrom: timeFromNew,
                    dateTo: timeToNew,
                    status: status
                }

                // console.log(newObjectArray)


            }

            return newObjectArray;

        },

        onFilter: function(oEvent) {

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
                // apply the filters to the table binding
                oBinding.filter(aFilters);
            }else{
                oBinding.filter([]);
            }
        }

    })
})