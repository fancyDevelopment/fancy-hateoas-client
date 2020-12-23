import * as signalR from "@microsoft/signalr";
import { Observable, Subject } from "rxjs";
import { map, startWith } from 'rxjs/operators';

import { ResourceBase, ResourceSocket } from "./resource";
import { ConnectionStatus, SocketManager } from "./socket-manager";

class ConnectionManager {
    
    public connectionStatus = new Subject<ConnectionStatus>(); 

    private hubConnection: signalR.HubConnection;

    constructor(private url: string) {
        this.hubConnection = new signalR.HubConnectionBuilder().withUrl(url).build();
        this.hubConnection.start().then(() => {
            this.connectionStatus.next(ConnectionStatus.Connected);
        });
        this.hubConnection.onclose(() => {
            this.connectionStatus.next(ConnectionStatus.Disconnected);
        });
    }

    handleOnClose() {

    }
}

export class SignalRSocketManager extends SocketManager {

    public connectionStatus: Observable<ConnectionStatus>;

    public connectionStatusSubject: Subject<ConnectionStatus>;
    private signalRConnections: { [key: string]: signalR.HubConnection } = { };

    constructor() {
        super();
        this.connectionStatusSubject = new Subject<ConnectionStatus>();
        this.connectionStatus = this.connectionStatusSubject.asObservable();
    }

    public createSocketObserver(resource: ResourceBase, socket: ResourceSocket) {
        const observable = new Observable(subscriber => {
            // Check if there is already a connection for this url
            if(!this.signalRConnections[socket.href]) {
                // No connection is availalbe, create a new one
                this.signalRConnections[socket.href] = new signalR.HubConnectionBuilder().withUrl(socket.href).build();
                this.signalRConnections[socket.href].start().then(() => {
                    // Successfully connectd
                })
                .catch(() => {
                    // Error connecting to hub
                });
            }

            this.signalRConnections[socket.href].on(socket.method, (newData: any) => {
                subscriber.next(newData);
            });
        });

        return observable.pipe(startWith({...resource}),
                               map((newData: any) => { 
                                   this.update(resource, newData); 
                                   return resource;
                                }));
    }

    private update (targetObject: any, obj: any) {
      Object.keys(obj).forEach((key) => {
    
        // delete property if set to undefined or null
        if ( undefined === obj[key] || null === obj[key] ) {
          delete targetObject[key]
        }
    
        // property value is object, so recurse
        else if ( 
            'object' === typeof obj[key] 
            && !Array.isArray(obj[key]) 
        ) {
    
          // target property not object, overwrite with empty object
          if ( 
            !('object' === typeof targetObject[key] 
            && !Array.isArray(targetObject[key])) 
          ) {
            targetObject[key] = {}
          }
    
          // recurse
          this.update(targetObject[key], obj[key])
        }
    
        // set target property to update property
        else {
          targetObject[key] = obj[key]
        }
      })
    }
}
