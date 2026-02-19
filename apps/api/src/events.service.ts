import { Injectable } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class EventsService {
  private subject = new Subject<MessageEvent>();

  asObservable(): Observable<MessageEvent> {
    return this.subject.asObservable();
  }

  emit(type: string, data?: any) {
    this.subject.next({ data: JSON.stringify({ type, ...data }) });
  }
}
