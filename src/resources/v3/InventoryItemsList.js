import {currentDate} from "client/src/resources/helpers";
import {inventory} from "client/src/views/inventory";
import {InventoryItem} from "client/src/resources/v3/InventoryItem";
import {InventoryDate} from "client/src/resources/v3/InventoryDate";

export class InventoryItemsList {

    inventoryItems = [];

    indexById = {};

    selectedItems = {};

    selectedStatusById = {};

    selectedItemCounts = {
        count:0,
        qty:0
    }

    hasSelectedItems = false;

    isEmpty = true;

    setItems(items) {
        //need to re-init inventoryItems because transpiler and or aurelia does something funky and turns the
        //property into some kind of ArrayMutationObserver instead of an actual array. Do not care enough to research
        this.inventoryItems = [];

        for(let itemIndex of Object.keys(items)){
            const itemData = items[itemIndex];
            this.inventoryItems[itemIndex] = new InventoryItem(itemData);
        }

        this.isEmpty = this.inventoryItems.length === 0;

        for(let item of Object.entries(this.inventoryItems)){
            //item = [key,value] = [index, inventoryItem]
            this.indexById[item[1].id] = item[0];
        }

        this.updateCounts();
        console.log(this);
    }

    updateCounts(){
        const blankCountsObj = {
                isChecked: false,
                count: 0,
                qty: 0
            };


        const inventoryCounts = {
                shortDate:{},
                willExpire:{},
                ndc:{},
                isRepack:{},
                form:{}
            };

        for(let item of this.inventoryItems){

            let inventoryItem = new InventoryItem(item);

            for(let propertyName of Object.keys(inventoryCounts)){
                let itemPropertyValue = inventoryItem[propertyName];
                if(!inventoryCounts[propertyName][itemPropertyValue]){
                    inventoryCounts[propertyName][itemPropertyValue] = {count:0, qty:0};
                }

                inventoryCounts[propertyName][itemPropertyValue].count++;
                inventoryCounts[propertyName][itemPropertyValue].qty += inventoryItem.quantity;
            }
        }

        this.inventoryCounts = inventoryCounts;

        return inventoryCounts;
    }

    selectItemById(id){
        const inventoryItem = this.getItemById(id);

        if(!this.isItemIdSelected(id)){
            this.selectedItems[inventoryItem.id] = inventoryItem;
            this.selectedStatusById[inventoryItem.id] = true;

            //update counts
            this.selectedItemCounts.count++;
            this.selectedItemCounts.qty += inventoryItem.quantity;

            this.hasSelectedItems = true;
        }
    }

    unselectItemById(id){
        const inventoryItem = this.getItemById(id);

        if(this.isItemIdSelected(id)){
            delete this.selectedItems[inventoryItem.id];
            this.selectedStatusById[inventoryItem.id] = false;

            //update counts
            this.selectedItemCounts.count--;
            this.selectedItemCounts.qty -= inventoryItem.quantity;

            this.hasSelectedItems = this.selectedItemCounts.count > 0;
        }
    }

    isItemIdSelected(id){
        return this.selectedStatusById[id];
    }

    toggleSelectedById(id){
        if(this.isItemIdSelected(id)){
            this.unselectItemById(id);
        }
        else this.selectItemById(id);

        console.log(this.selectedItemCounts);
    }

    getSelectedItemIds(){
        return Object.keys(this.selectedItems);
    }

    getSelectedMinExpirationDate(){
        let expirationDate = null;

        for(let selectedItem of Object.values(this.selectedItems)){
            console.log(selectedItem);
            if(!expirationDate || selectedItem.expirationDate < expirationDate){
                expirationDate = selectedItem.expirationDate;
            }
        }

        return expirationDate;
    }

    getSelectedItems(){
        return this.selectedItems;
    }

    initRepack(){
        const newItems = [];

        const defaultExpiration = this.getSelectedMinExpirationDate();

        const defaultRepackQty = 30 * Math.floor(this.selectedItemCounts.qty / 30);

        const selectedItemQuantity = this.getSelectedItemQuantity();

        const sourceItemIds = this.getSelectedItemIds();

        let details = {
            qty: defaultRepackQty,
            excess:0,
            other:0
        };

        if(details.qty < selectedItemQuantity){
            details.excess = selectedItemQuantity - details.qty;
        }

        if((details.qty + details.excess) < selectedItemQuantity){
            details.other = selectedItemQuantity - (details.qty + details.excess);
        }

        newItems.push({
            qty:details.qty,
            exp:defaultExpiration,
            bin:null,
            sourceIds:sourceItemIds
        });

        if(details.excess > 0){
            newItems.push({
                qty:details.excess,
                exp:defaultExpiration,
                bin:null,
                sourceIds:sourceItemIds
            });
        }

        console.log(details);
        console.log(newItems);

        return newItems;
    }

    getSelectedItemCount(){
        return this.selectedItemCounts.count;
    }

    getSelectedItemQuantity(){
        return this.selectedItemCounts.qty;
    }


    getItemIndexUsingId(id){
        let index = null;

        for (let i = 0; i < this.inventoryItems.length; i++) {
            if (this.inventoryItems[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    getItemById(id) {
        return this.inventoryItems[this.getItemIndexUsingId(id)];
    }

    removeItemById(id){
        let index = this.getItemIndexUsingId(id);

        if(index !== null){
            let inventoryItem = this.inventoryItems[index];
            this.inventoryItems.splice(index, 1);
            return inventoryItem;
        }

        return null;
    }
}