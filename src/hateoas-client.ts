import { RequestManager } from  "./request-manager";
import { ResourceBase } from "./resource";
import { SocketManager } from "./socket-manager";


/**
 * An http client which reads the metadata out of json objects and create proper 
 * functions on the requested resource to interact with it. 
 */
export class HateoasClient {

    /**
     * Creates a new instance of the HateoasClient
     * @param requestManager A request managager to use to execute http requests.
     * @param _socketManager A socket manager to use to work with web sockets.
     */
    constructor(private _requestManager: RequestManager, private _socketManager: SocketManager) {
    }

    public async fetch(url: string): Promise<ResourceBase | ResourceBase[]> {
        const resource = await this._requestManager.fetch(url);

        if(Array.isArray(resource)) {
            resource.forEach(r => this.injectHateoasProperties(r));
        } else {
            this.injectHateoasProperties(resource);
        }

        return resource;
    }

    public injectHateoasProperties(resource: ResourceBase) {
        this.injectLinks(resource);
        this.injectActions(resource);

        if(this._socketManager) {
            this.injectSockets(resource);
        }

        for (const key in resource) {
            if (resource.hasOwnProperty(key)) {
                const value = resource[key];
                if (value && key !== '_actions' && key !== '_links' && key !== '_sockets' && typeof value === 'object') {
                    this.injectHateoasProperties(value);
                }
            }
        }
    }

    private injectLinks(resource: ResourceBase) {
        if (resource._links) {
            for (const linkKey in resource._links) {
                if (resource._links.hasOwnProperty(linkKey)) {
                    const resourceLink = resource._links[linkKey];
                    const fetchFunc = this.createFetchFunc(resourceLink.href)

                    // Add the fetch func to the root object as well as to the link object
                    resource['fetch_' + linkKey] = fetchFunc;
                    resource._links[linkKey].fetch = fetchFunc;
                }
            }
        }
    }

    private injectActions(resource: ResourceBase) {
        if (resource._actions) {
            for (const actionKey in resource._actions) {
                if (resource._actions.hasOwnProperty(actionKey)) {
                    const resourceAction = resource._actions[actionKey];
                    resource[actionKey] = this._requestManager.createActionFunc(resource, resourceAction);
                }
            }
        }
    }

    private injectSockets(resource: ResourceBase) {
        if(!this._socketManager) {
            throw new Error('No socket manager set to HateoasClient');
        }
        if (resource._sockets) {
            for (const socketKey in resource._sockets) {
                if (resource._sockets.hasOwnProperty(socketKey)) {
                    const resourceSocket = resource._sockets[socketKey];
                    resource[socketKey + '$'] = this._socketManager.createSocketObserver(resource, resourceSocket);
                }
            }
        }
    }

    private createFetchFunc(href: string) {
        return (queryParams?: {[key: string]: string | number }): Promise<ResourceBase | ResourceBase[] | null> => {
            let url = href;
            if(queryParams) {
                // Add additional query params
                if(url.indexOf('?') > 0) { url = url + '&'; }
                else { url = url + '?'; }
                for(var key in queryParams) {
                    url = url + key + '=' + queryParams[key] + '&';
                }
                // Remove the last not needed concatenation character
                url = url.substring(0, url.length - 1);
            }
            return this.fetch(url);
        }
    }
}
