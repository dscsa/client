export class PendGroup {

    isShoppable(){
        return this.shopList && this.shopList.length > 0;
    }
    constructor(serverData = null) {
        this.baskets = null;
        this.lock = null;
        this.isLockedByCurrentUser = null;
        this.name = null;
        this.priority = null;

        this.shopList = null;

        if (serverData) {
            this.importServerData(serverData);
        }
    }

    importServerData(groupData) {
        //todo: SE. resolve js PendGroup field names with server side code. no renaming of same entities/properties
        this.baskets = groupData && groupData.baskets ? groupData.baskets.split(',') : [];
        this.isLockedByCurrentUser = groupData.is_locked === 1
            && parseInt(groupData.locked_by, 10) === v3.currentUser.id;
        this.locked = groupData.is_locked === 1;
        this.name = groupData.group_name;
        this.priority = groupData.order_priority !== 'normal';
        this.numShopListItems = groupData.num_inventory_items;

        if (this.locked === true) {
            this.lock = {
                _id: groupData.locked_at,
                userId: groupData.locked_by,
                name: {
                    first: groupData.locked_by_first_name,
                    last: groupData.locked_by_last_name
                },
                date: groupData.locked_at
            };
        }
    }


    loadFromName(name, callback) {
        let request = v3.getRequest('picking/load/' + name);

        request.onSuccess((serverData) => {
            this.importServerData(serverData);

            if(callback){
                callback(this);
            }
        });


    }

    saveBasket(basket){
        let request = v3.postRequest('picking/save_basket', {
            groupName:this.name,
            basket:basket
        });

        request.onSuccess((allBaskets) => {
            this.baskets = allBaskets;
        });

        return request;
    }

    onShopListLoad(callback){
        this.onShopListLoadCallback = callback;
    }

    runOnShopListLoadCallback(){
        if(this.onShopListLoadCallback){
            this.onShopListLoadCallback();
        }
    }

    loadShopList(callback){
        let request = v3.getRequest('picking/shop_list/' + this.name);

        request.onSuccess((serverData) => {
            this.importShopList(serverData);

            if(callback){
                callback(this);
            }
        });
    }

    importShopList(serverData){
        this.importServerData(serverData.groupData);
        this.pendItems = serverData.pendItems;
        this.shopList = serverData.list;

        this.shopList.forEach((item, index) => {
            if(item.picked_result){
                this.setOutcome(index, item.picked_result);
            }
        })
        this.indexItems();
        this.runOnShopListLoadCallback();
    }

    indexItems(){
        this.mapPendItemIdToIndex = {};
        this.pendItems.forEach((pendItem, index) => {
            this.mapPendItemIdToIndex[pendItem.id] = index;
        })

        this.mapShopListItemIndexToPendItemIndex = {}
        this.shopList.forEach((shopListItem, index) => {
            this.mapShopListItemIndexToPendItemIndex[index] = this.mapPendItemIdToIndex[shopListItem.pend_item_id];
        });
    }

    prepShoppingIndex(index){
        const pendItemStatus = this.getPendItemStatus(index);
        const baskets = pendItemStatus ? pendItemStatus.baskets : null;

        if(baskets && baskets.length){
            let basket = baskets.slice(-1)[0];

            const letter = basket.slice(0, 1);
            const number = basket.slice(1);

            return {
                letter: letter,
                number: number,
                fullBasket: basket
            };
        }

        return null;
    }

    getPendItemStatus(shopListItemIndex){
        const pendItemIndex = this.mapShopListItemIndexToPendItemIndex[shopListItemIndex];
        console.log(shopListItemIndex, pendItemIndex, this.pendItems);

        return this.pendItems[pendItemIndex];
    }

    saveShoppingResults(index, basket, callback){

        let request = v3.postRequest('picking/pick_item', {
            'pended_inventory_item_id' : this.shopList[index].id,
            'result' : this.shopList[index].outcomeText,
            'basket' : basket.fullBasket
        });

        request.onSuccess((serverData) => {
            this.importShopList(serverData);
            if(callback){
                callback();
            }
        });

        return request;
    }

    setOutcome(index, outcome){
        let outcomeObject = {
            'exact_match':false,
            'roughly_equal':false,
            'slot_before':false,
            'slot_after':false,
            'missing':false,
        };

        outcomeObject[outcome] = true;

        this.shopList[index].outcomeText = outcome;
        this.shopList[index].outcome = outcomeObject;
    }

    getOutcome(index){
        return this.shopList[index].outcomeText || null;
    }
}
