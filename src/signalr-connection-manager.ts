import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { ConnectionStatus } from './socket-manager';

class SignalRConnectionManager {

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
}
