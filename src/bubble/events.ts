import { BubbleMock, BubbleEventName } from '../mock/BubbleMock';

/**
 * EventBridge - Handles communication from the editor to Bubble events
 */
export class EventBridge {
  private bubble: BubbleMock;
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(bubble: BubbleMock) {
    this.bubble = bubble;
  }

  /**
   * Trigger a Bubble event immediately
   */
  trigger(name: BubbleEventName, data?: Record<string, unknown>): void {
    this.bubble.triggerEvent(name, data);
  }

  /**
   * Trigger a Bubble event with debouncing (useful for content_changed)
   */
  triggerDebounced(
    name: BubbleEventName, 
    data?: Record<string, unknown>,
    delay = 300
  ): void {
    const existingTimer = this.debounceTimers.get(name);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.bubble.triggerEvent(name, data);
      this.debounceTimers.delete(name);
    }, delay);

    this.debounceTimers.set(name, timer);
  }

  /**
   * Cancel any pending debounced events
   */
  cancelPending(name: BubbleEventName): void {
    const timer = this.debounceTimers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(name);
    }
  }

  /**
   * Cancel all pending debounced events
   */
  cancelAllPending(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  destroy(): void {
    this.cancelAllPending();
  }
}
