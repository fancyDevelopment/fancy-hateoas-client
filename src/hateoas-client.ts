import { AxiosRequestManager } from ".";
import { RequestManager } from  "./request-manager";
import { ResourceBase } from "./resource";
import { ResourceEndpoint } from "./resource-endpoint";
import { SocketManager } from "./socket-manager";

/**
 * An http client which reads the metadata out of json objects and create proper 
 * functions on the requested resource to interact with it. 
 */
export class HateoasClient {

    private _requestManager: RequestManager;

    /**
     * Creates a new instance of the HateoasClient
     * @param requestManager A request managager to use to execute http requests.
     * @param _socketManager A socket manager to use to work with web sockets.
     */
    constructor(requestManager?: RequestManager, private _socketManager?: SocketManager) {
        if(requestManager) {
            this._requestManager = requestManager;
        } else {
            this._requestManager = new AxiosRequestManager();
        }
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
                    resource['fetch_' + linkKey] = () => this.fetch(resourceLink.href);
                    resource._links[linkKey] = new ResourceEndpoint(resourceLink.href, this);
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
}
