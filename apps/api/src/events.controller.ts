import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventsService } from './events.service';

@Controller('api/events')
export class EventsController {
  constructor(private events: EventsService) {}

  @Sse()
  eventsStream(): Observable<MessageEvent> {
    return this.events.asObservable();
  }
}
