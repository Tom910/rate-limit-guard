export class Deque<Value> {
  private newStack: Value[] = [];
  private oldStack: Value[] = [];
  private oldStackFirstIndex = 0;

  push(value: Value): void {
    this.newStack.push(value);
  }

  pop() {
    if (this.newStack.length !== 0) {
      return this.newStack.pop();
    }
    if (
      this.oldStack.length !== 0 &&
      this.oldStackFirstIndex < this.oldStack.length
    ) {
      return this.oldStack.pop();
    }

    return null;
  }

  shift() {
    if (this.size() === 0) {
      return null;
    }

    if (this.newStack.length !== 0) {
      if (
        this.oldStack.length === 0 ||
        this.oldStackFirstIndex === this.oldStack.length
      ) {
        this.oldStack = this.newStack;
        this.oldStackFirstIndex = 0;
        this.newStack = [];
      }
    }

    const value = this.oldStack[this.oldStackFirstIndex];
    this.oldStack[this.oldStackFirstIndex] = this.oldStack[0]; // remove element

    this.oldStackFirstIndex++;

    return value;
  }

  size() {
    return (
      this.newStack.length + this.oldStack.length - this.oldStackFirstIndex
    );
  }
}
