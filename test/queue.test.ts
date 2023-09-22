import { Queue } from "../src/queue";

describe("Queue", () => {
  test('should push and pop', () => {
    const queue = new Queue<number>();
    queue.push(1);
    queue.push(2);
    queue.push(3);
    expect(queue.pop()).toBe(3);
    expect(queue.pop()).toBe(2);
    expect(queue.pop()).toBe(1);
  });

  test('should push and shift', () => {
    const queue = new Queue<number>();
    queue.push(1);
    queue.push(2);
    queue.push(3);
    expect(queue.shift()).toBe(1);
    expect(queue.shift()).toBe(2);
    expect(queue.shift()).toBe(3);
  });

  test('should push and shift and pop', () => {
    const queue = new Queue<number>();
    queue.push(1);
    queue.push(2);
    queue.push(3);
    expect(queue.shift()).toBe(1);
    expect(queue.size()).toBe(2);
    expect(queue.pop()).toBe(3);
    expect(queue.size()).toBe(1);
    expect(queue.shift()).toBe(2);
    expect(queue.size()).toBe(0);
    queue.push(4);
    expect(queue.size()).toBe(1);
    expect(queue.shift()).toBe(4);
    expect(queue.size()).toBe(0);
    expect(queue.shift()).toBe(null);
    expect(queue.pop()).toBe(null);
  });

  test('should works and return correct result value with Bitwise calculation', () => {
    const queue = new Queue<number>();
    let result = 1;
    for (let i = 0; i < 1000; i++) {
      queue.push(i);
    }

    for (let i = 0; i < 250; i++) {
      result = (result * (queue.pop() || 1)) % 1000000007
    }
    expect(queue.size()).toBe(750);
    for (let i = 0; i < 250; i++) {
      result = (result * (queue.shift() || 1)) % 1000000007
    }
    expect(queue.size()).toBe(500);
    for (let i = 0; i < 250; i++) {
      result = (result * (queue.shift() || 1)) % 1000000007
    }
    expect(queue.size()).toBe(250);
    for (let i = 0; i < 250; i++) {
      result = (result * (queue.pop() || 1)) % 1000000007
    }

    expect(result).toBe(756641425);
  });
});
