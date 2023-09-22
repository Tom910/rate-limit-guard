export class Queue<Value> {
  private newStack: Value[] = [];
  private oldStack: Value[] = [];
  private oldStackFirstIndex = 0;

  push(value: Value): void {
    this.newStack.push(value);
  }

  pop() {
    if (this.newStack.length !== 0) {
      return this.newStack.pop();
    } else if (this.oldStack.length !== 0) {
      return this.oldStack.pop();
    }

    return null;
  }

  shift() {
    if (this.size() === 0) {
      return null;
    }

    if (this.oldStack.length === 0 && this.newStack.length !== 0) {
      this.oldStack = this.newStack;
      this.oldStackFirstIndex = 0;
      this.newStack = [];
    }

    if (this.oldStack.length !== 0 && this.oldStackFirstIndex < this.oldStack.length) {
      const value = this.oldStack[this.oldStackFirstIndex];

      //@ts-ignore
      this.oldStack[this.oldStackFirstIndex] = null;
      this.oldStackFirstIndex++;

      if (this.oldStackFirstIndex === this.oldStack.length) {
        this.oldStack = [];
        this.oldStackFirstIndex = 0;
      }

      return value;
    }

    return null;
  }

  size() {
    return this.newStack.length + this.oldStack.length - this.oldStackFirstIndex;
  }
}
