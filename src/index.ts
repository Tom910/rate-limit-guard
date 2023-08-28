import type { IntervalHistogram } from 'perf_hooks';
import { monitorEventLoopDelay } from 'perf_hooks';
import { DoubleLinkedList } from './doubleLinkedList';

export const DEFAULT_OPTIONS = {
  activeLimit: 10,
  queueLimit: 100,
  maxEventLoopDelay: 100,
  hasImportantQueue: false,
  isRequestExpired: () => false,
};

export interface RateLimitOptions<Payload = any> {
  hasImportantQueue: boolean;
  activeLimit: number;
  queueLimit: number;
  maxEventLoopDelay: number;
  handleDiscardedRequest: (payload: Payload) => void;
  handleNextRequest: (payload: Payload) => void;
  isRequestExpired: (payload: Payload) => boolean;
}

const resolution = 10;

type PartialExcept<T, K extends keyof T> = Partial<T> & { [P in K]: T[P] }

export class RateLimit<Payload = any> {
  private currentActive = 0;
  private queue = new DoubleLinkedList<Payload>();
  private queueImportant = new DoubleLinkedList<Payload>();
  private minimalActiveRequestLimit: number;
  private eventLoopHistogram: IntervalHistogram;

  private activeLimit: RateLimitOptions['activeLimit'];
  private queueLimit: RateLimitOptions['queueLimit'];
  private handleDiscardedRequest: RateLimitOptions['handleDiscardedRequest'];
  private handleNextRequest: RateLimitOptions['handleNextRequest'];
  private isRequestExpired: RateLimitOptions['isRequestExpired'];
  private maxEventLoopDelay: RateLimitOptions['maxEventLoopDelay'];
  private hasImportantQueue: RateLimitOptions['hasImportantQueue'];
  private timer: NodeJS.Timer;

  constructor(userOptions: PartialExcept<RateLimitOptions<Payload>, 'handleDiscardedRequest' | 'handleNextRequest'>) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...userOptions
    }

    this.hasImportantQueue = options.hasImportantQueue;
    this.activeLimit = options.activeLimit;
    this.queueLimit = options.queueLimit;
    this.maxEventLoopDelay = options.maxEventLoopDelay;
    this.handleDiscardedRequest = options.handleDiscardedRequest;
    this.handleNextRequest = options.handleNextRequest;
    this.isRequestExpired = options.isRequestExpired;

    this.minimalActiveRequestLimit = Math.round(this.activeLimit / 3);

    this.eventLoopHistogram = monitorEventLoopDelay({ resolution });
    this.eventLoopHistogram.enable();

    this.timer = setInterval(() => this.nextTick(), 1000);
    this.timer.unref();
  }

  add(data: Payload, isImportantRequest: boolean) {
    if (this.currentActive < this.activeLimit) {
      this.run(data);
      return;
    }

    // for important requests we have separate queue
    if (isImportantRequest) {
      return this.addRun(this.queueImportant, data);
    }

    return this.addRun(this.queue, data);
  }

  private addRun(queue: DoubleLinkedList<Payload>, data: Payload) {
    if (queue.length >= this.queueLimit) {
      const lastNode = queue.shift();

      this.handleDiscardedRequest(lastNode)
    }
    queue.push(data);
  }

  finish() {
    this.currentActive--;
    this.loop();
  }

  destroy() {
    clearInterval(this.timer)
  }

  // General idea is change limits every second. Because if DDOS was happened we need some time to get problem with event loop. And better if we slowly adapt
  private nextTick() {
    let eventLoopDelay = Math.max(0, this.eventLoopHistogram.mean / 1e6 - resolution);
    if (Number.isNaN(eventLoopDelay)) eventLoopDelay = Infinity;
    this.eventLoopHistogram.reset();

    if (this.maxEventLoopDelay >= eventLoopDelay) {
      if (this.currentActive >= this.activeLimit) {
        this.activeLimit++;
      }
      // We need to have minimalActiveRequestLimit
    } else if (this.activeLimit > this.minimalActiveRequestLimit) {
      this.activeLimit--;
    }
  }

  private loopQueue(queue: DoubleLinkedList<Payload>) {
    while (queue.length > 0 && this.currentActive < this.activeLimit) {
      // better if we start with new requests. Because more opportunity to answer before client cancel request
      const nextRequest = queue.pop()!;

      if (!this.isRequestExpired(nextRequest)) {
        this.run(nextRequest);
      } else {
        this.handleDiscardedRequest(nextRequest);
      }
    }
  }

  private loop() {
    if (this.hasImportantQueue) {
      this.loopQueue(this.queueImportant);
    }
    this.loopQueue(this.queue);
  }

  private run(payload: Payload) {
    this.currentActive++;

    this.handleNextRequest(payload);
  }
}
