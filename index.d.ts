import Events from 'mmevents'
interface IProps {
  listenChannel: string;
  emitChannel: string;
  bridge: any;
  maxDataOnAir?: number;
  storagePrefix?: string;
  showLog?: boolean;
}
declare class EventCenter extends Events {
  constructor(props: IProps)
  send(type: string, data?: any): Promise<void>
  listen(type: string, callback: Function): this
  stopListen(type: string, callback: Function): this
  destroy(): Promise<void>
}

export default EventCenter