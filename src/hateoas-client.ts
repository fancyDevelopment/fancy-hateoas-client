import { RequestManager } from "./request-manager";
import { ResourceBase } from "./resource";
import { SocketManager } from "./socket-manager";

export class HateoasClient {
    constructor(private requestManager: RequestManager, private socketManager: SocketManager) {}

    public async fetch(url: string): Promise<ResourceBase | ResourceBase[]> {
        const resource = await this.requestManager.fetch(url);

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
        this.injectSockets(resource);

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
                    resource['fetch-' + linkKey] = () => {
                        return new Promise<object>(async (resolve, reject) => {
                            const connectedResource = await this.requestManager.fetch(resourceLink.href);
                            this.injectHateoasProperties(connectedResource);
                            resolve(connectedResource);
                        });
                    };
                }
            }
        }
    }

    private injectActions(resource: ResourceBase) {
        if (resource._actions) {
            for (const actionKey in resource._actions) {
                if (resource._actions.hasOwnProperty(actionKey)) {
                    const resourceAction = resource._actions[actionKey];
                    resource[actionKey] = this.requestManager.createActionFunc(resource, resourceAction);
                }
            }
        }
    }

    private injectSockets(resource: ResourceBase) {
        if (resource._sockets) {
            for (const socketKey in resource._sockets) {
                if (resource._sockets.hasOwnProperty(socketKey)) {
                    const resourceSocket = resource._sockets[socketKey];
                    resource[socketKey + '$'] = this.socketManager.createSocketObserver(resource, resourceSocket);
                }
            }
        }
    }
}
