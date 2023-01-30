sap.ui.define([
        "sap/ui/core/mvc/Controller",
        'sap/ui/model/resource/ResourceModel',
        'sap/ui/model/json/JSONModel'
    ], function (Controller, ResourceModel, JSONModel) {
        'use strict'
        var oRouter;
        var oStore;

        return Controller.extend('raumreservierung.controller.NavBar',
            {
                onInit() {
                    var oModel = new JSONModel(sap.ui.require.toUrl("raumreservierung/model/navBarData.json"));
			        this.getView().setModel(oModel);

                    oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                    oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);

                },

                onSelectWindow(oEvent){
                    var key = oEvent.getParameter('key');

                    if(key == 'raumbuchung'){
                        oRouter.navTo('raumbuchung')
                        
                    } else if( key == 'profil'){
                        oRouter.navTo('profil')
                        
                    } else if ( key == 'buchungen'){
                        oRouter.navTo('buchungen')
                        
                    } else if ( key == 'logout'){
                        oStore.clear();
                        oRouter.navTo('anmeldung')
                        location.reload();
                    }
                }
            })
    }
);