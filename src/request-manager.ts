import { ResourceAction, ResourceBase, ResourceLink } from "./resource";

export type ActionFunc = (body?: any) => Promise<any>;

export abstract class RequestManager {
    fetch(url: string): Promise<ResourceBase | ResourceBase[] | null> {
        return this.request('GET', url);
    }

    createActionFunc(resource: ResourceBase, action: ResourceAction): ActionFunc {
        if (action.method === 'PUT' || action.method === 'POST') {
            return (bodyToSend: any) => {
                // If the caller has provided a body to send use it ...
                let bodyContent = bodyToSend;
                // ... if not send the own object back to the server.
                if (!bodyContent) { bodyContent = resource; }
                // Execute the request
                return this.request(action.method, action.href, bodyContent);
            };
        } else {
            return () => {
                return this.request(action.method, action.href);
            };
        }
    }

    protected abstract request(method: 'GET' | 'PUT' | 'POST' | 'DELETE', url: string, body?: any): Promise<any>;
}