interface ListNode<Value> {
  next: ListNode<Value> | null;
  prev: ListNode<Value> | null;
  value: Value;
}

export class DoubleLinkedList<Value> {
  length = 0;
  private start: ListNode<Value> | null = null;
  private end: ListNode<Value> | null = null;

  push(value: Value): void {
    const newNode = {
      value,
      next: null,
      prev: null,
    };
    this.length++;
    if (this.start === null) {
      this.start = newNode;
      this.end = newNode;
      return;
    }

    const currentEnd = this.end;
    this.end = newNode;
    this.end.prev = currentEnd;
    if (currentEnd !== null) {
      currentEnd.next = this.end;
    }
  }

  pop() {
    if (this.end === null) {
      return null;
    }
    this.length--;
    // if equal we have only 1 node, so we just remove start
    if (this.end === this.start) {
      this.start = null;
    }
    const { value } = this.end;
    this.end = this.end.prev;
    if (this.end) {
      this.end.next = null;
    }

    return value;
  }

  shift() {
    if (this.start === null) {
      return null;
    }
    this.length--;
    // if equal we have only 1 node, so we just remove end
    if (this.end === this.start) {
      this.end = null;
    }
    const { value } = this.start;
    this.start = this.start.next;
    if (this.start) {
      this.start.prev = null;
    }

    return value;
  }

  size() {
    return this.length;
  }
}
