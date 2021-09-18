
import {HttpClient} from 'aurelia-http-client';

const httpClient = new HttpClient();


//todo:why is this so complicated?
class Request{
    serverUrl(urlPart){
        return 'http://localhost:7000/' + urlPart;
    }

    get(urlPart){
        this.request = httpClient.get(this.serverUrl(urlPart));
        return this;
    }

    post(urlPart, data){
        this.request = httpClient.post(this.serverUrl(urlPart), data);
        return this;
    }

    handleServerResponse(callback){
        this.serverResponseHandler = callback;

        this.request.then((httpResponseMessage) => {
            this.serverResponse = httpResponseMessage;
            this.handleResponse();
        });
    }

    onError(callback){
        this.errorHandler = callback;

        if(this.serverResponse){
            this.handleResponse();
        }
        else this.request.catch(callback);

        return this;
    }

    onSuccess(callback){
        this.handleServerResponse(callback);
        return this;
    }

    onResponse(callback){
        this.handleServerResponse(callback);
        return this;
    }

    handleResponse(response){
        if(this.responseHandled){
            //we already handled it
            return;
        }

        response = response || this.serverResponse;

        //nothing to handle
        if(!response){
            return;
        }

        //run appropriate handler
        let result = null;
        if(response.statusCode >= 400){
            result = this.errorHandler(response);
        }
        else{
            result = this.serverResponseHandler(response.content);
        }

        this.responseHandled = true;

        return result;
    }

    runErrorHandler(response = null){
        if(this.errorHandler){
            this.errorHandler(response);
        }
    }

}

class v3{
    constructor(){

    }

    getRequest(urlPart){
        return new Request().get(urlPart);
    }

    postRequest(urlPart, data){
        return new Request().post(urlPart, data);
    }

    getCurrentUser(){
        const gettingUser = (resolve, reject) => {
            this.getRequest('current_user').onResponse(responseData => {
                    this.currentUser = responseData.body;
                    this.xsrfToken = responseData.data.token;

                httpClient.configure(config => {
                    config.withHeader('X-XSRF-TOKEN', this.xsrfToken);
                });
                    console.log(this);
                });

                resolve(this.curretnUser);
        }

        return new Promise(gettingUser);
    }
}

window.v3 = v3;
