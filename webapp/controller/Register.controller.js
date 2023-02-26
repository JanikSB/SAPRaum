sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageToast'
], function(Controller, MessageToast) {
    'use strict';

    var oModel;
    var oRouter
    var that;
    var oStore;

    var users;
    var userid;

    //variablen fuer user inputs
    var selUsername
    ,selEmail
    ,selPassword
    ,selPasswordConfirm;

    var username,
    email,
    password,
    passwordConfirm;

    var filledData = false;

    return Controller.extend('raumreservierung.controller.Register', {
        
        
        onInit(){
            that = this;
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);

            if(oStore.get('logUser') !== null){
                oRouter.navTo('raumbuchung');
            }
            oModel = this.getOwnerComponent().getModel('Model');
            this.readUsers();


        },

        getSelections(){
            selUsername = this.byId('registerUsername');
            selEmail = this.byId('registerEmail');
            selPassword =  this.byId('registerPassword');
            selPasswordConfirm =  this.byId('registerPasswordConfirm');  
            
            username = selUsername.getValue();
            email = selEmail.getValue();
            password = selPassword.getValue();
            passwordConfirm = selPasswordConfirm.getValue();

            if(username && email && password && passwordConfirm){
                if(password === passwordConfirm){
                   filledData = true; 
                }else{
                    MessageToast.show('Passwörter stimmen nicht überein')
                }
            }else{
                MessageToast.show('Fehlende Inputs')
            }
        },

        compareUsers(){
            var userNotExist = true;

            for(var i = 0; i < users.length; i++){
                if(users[i].username == username){
                    userNotExist = false;
                    MessageToast.show('Benutzername existiert bereits')
                }else if(users[i].email == email){
                    userNotExist = false;
                    MessageToast.show('E-Mail Adresse wird bereits genutzt');
                }
            }

            return userNotExist;
        },

        register(){
            this.getSelections();
            if(filledData){
                console.log('Input erfolgreich eingegeben');
                if(that.compareUsers()){
                    console.log('Nutzer Input verifiziert');
                    debugger;
                    oStore.put('logUser', {username: username, userid: userid});
                    oModel.createEntry("/USERS", {
                        properties: {
                          userid: userid,
                          username: username,
                          email: email,
                          passwort: password
                        }
                      });
                    oModel.submitChanges();
                    userid++;
                    oRouter.navTo('raumbuchung');
                }
            }
        },

        readUsers(){
            return new Promise((resolve, reject) => {
                oModel.read("/USERS", {
                    success: function (oData) {
                        resolve(oData)              
                    },
                    error: function (oError) {            
                        reject(oError);
                    }
                });       
            }).then((data) => {
                users= data.results;
                userid = users[users.length-1].userid + 1;
            })
            
        },

        onPressLog(oEvent){
            oRouter.navTo('anmeldung');
        },

        
    });
});