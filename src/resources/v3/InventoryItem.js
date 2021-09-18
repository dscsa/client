import {currentDate} from "client/src/resources/helpers";

export class InventoryItem{
    constructor(data){
        for(let datum of Object.entries(data)){
            const propertyName = this.camelCase(datum[0]);
            this[propertyName] = datum[1];
        }

        this.willExpire = this.calcWillExpire();
        this.isRepack = this.calcIsRepack();
        this.expirationDate = this.formatExpirationDate();
        this.shortDate = this.expirationDate.substr(0, 7);
        this.ndc = this.drugId;
        this.form = this.productForm;
    }


    formatExpirationDate(){
        return this.expirationDate.substr(0, 10);
    }

    calcWillExpire(){
        const oneMonthFromNow = currentDate(1)
        return oneMonthFromNow > this.expirationDate.slice(0, 7);
    }

    calcIsRepack() {
        return this.bin && (this.bin.length === 3)
    }

    camelCase(string) {
        //adapted from the jQuery source
        return string.replace(/[_-]([a-z]|[0-9])/ig, function (all, letter) {
            return (letter + "").toUpperCase();
        });
    }

    //todo: still needed?
    getValue(propertyName){
        if(this[propertyName]){
            return this[propertyName];
        }

        const getterFunctionName = 'get' + propertyName;
        if(this[getterFunctionName] && typeof this[getterFunctionName] === 'function'){
            return this[getterFunctionName];
        }

        return null;
    }


}