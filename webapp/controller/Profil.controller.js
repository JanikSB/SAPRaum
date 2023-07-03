sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/model/odata/AnnotationHelper'

], function (Controller, JSONModel, Fragment) {
    'use strict';

    var localId;
    var oRouter;

    return Controller.extend('raumreservierung.controller.Profil', {
        

        onInit(oEvent) {
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);

            var object = this;

            var newModel = new JSONModel();

            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            localId = oStore.get('logUser').userid;

            if(!localId){
             oRouter.navTo('anmeldung');
            }

            var omodel = this.getOwnerComponent().getModel('Model');

            omodel.read('/USERS', {
                filters: [
                    new sap.ui.model.Filter({
                        path: "userid",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: localId
                    })
                ],

                success: function (res) {
                    var odatares = res.results;

                    console.log(odatares[0])

                    newModel.setData(odatares[0]);
                    
                    object.getView().setModel(newModel)
                }
            })

            

            //    this._formFragments = {};

            //    this._showFormFragment('ProfilDisplay')


        }

        // ,

        // _getFormFragment(sFragmentName){
        //     var pFormFragment = this._formFragments[sFragmentName],
        // 		oView = this.getView();

        // 	if (!pFormFragment) {
        // 		pFormFragment = Fragment.load({
        // 			id: oView.getId(),
        // 			name: "raumreservierung.view.fragment." + sFragmentName
        // 		});
        // 		this._formFragments[sFragmentName] = pFormFragment;
        // 	}

        // 	return pFormFragment;
        // },

        // _showFormFragment(sFragmentName) {
        //     var oPage = this.byId("page");

        // 	this._getFormFragment(sFragmentName).then(function(oVBox){
        // 		oPage.insertContent(oVBox);
        // 	});
        // }

    });
});