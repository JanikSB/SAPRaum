sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        'sap/ui/model/resource/ResourceModel'

    ],
    function (Controller, JSONModel, MessageToast, ResourceModel) {
        "use strict";

        return Controller.extend("raumreservierung.controller.App", {
            onInit() {

            },
            onOpenDialog() {
                this.getOwnerComponent().openHelloDialog();
            }


            
        });
    }
);
