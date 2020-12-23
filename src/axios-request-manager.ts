import { ActionFunc, RequestManager } from "./request-manager";
import { ResourceBase, ResourceAction } from "./resource";

export class AxiosRequestManager extends RequestManager {
    protected request(method: "GET" | "PUT" | "POST" | "DELETE", url: string, body?: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
}