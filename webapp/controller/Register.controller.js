sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    'use strict';


    return Controller.extend('raumreservierung.controller.Register', {
        
        onInit(){
           
        },

        onPressLog(oEvent){
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo('anmeldung');
        }
    });
});