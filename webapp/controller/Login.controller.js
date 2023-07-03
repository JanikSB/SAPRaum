sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'jquery.sap.storage',
    'sap/m/MessageToast'
], function(Controller, jQuery, MessageToast) {
    'use strict';

    var oRouter;
    var oStore;

    return Controller.extend('raumreservierung.controller.Login', {
        
        
        onInit(){
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);

            if(oStore.get('logUser') !== null){
                oRouter.navTo('raumbuchung');

                location.reload();
            }
        },

        onPressReg(oEvent){
            oRouter.navTo('register');
        },

        onPressLogin(){
            var email = this.byId('loginEmail').getValue();
            var passwort = this.byId('loginPasswort').getValue();
             
            if(email.length > 1 && passwort.length > 1){
                this.readUsers(email, passwort);
            }
            
            
        },
        readUsers(email, passwort) {

            var oModel = this.getView().getModel("Model");
            var checked = false;
            var oEmail;
            var oPasswort;
            var oName;
            var oId;
            var count = 0;


            oModel.read('/USERS', {
                success: function(response){
                    var odataRes = response.results;
                    
                    // einlogdaten ueberpruefen
                    while(checked == false && odataRes.length > count){
                        oEmail = odataRes[count].email;
                        oPasswort = odataRes[count].passwort;
                        oId = odataRes[count].userid;
                        oName = odataRes[count].username;

                        count ++;

                        // bei uebereinstimmung
                        if(oEmail == email && oPasswort == passwort){
                            checked = true;

                            oStore.put('logUser', {username: oName, userid: oId});
                            
                            oRouter.navTo('raumbuchung');

                            location.reload();
                        }
                    }

                    if(checked == false){
                        MessageToast.show('Anmeldedaten stimmen nicht überein')
                    }

                },
                error: function(oError){
                    console.log(oError)
                }
            })

            
        }

        
    });
});