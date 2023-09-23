import { Deque } from "../src/deque";

describe("Deque", () => {
  test('should push and pop', () => {
    const deque = new Deque<number>();
    deque.push(1);
    deque.push(2);
    deque.push(3);
    expect(deque.pop()).toBe(3);
    expect(deque.pop()).toBe(2);
    expect(deque.pop()).toBe(1);
  });

  test('should push and shift', () => {
    const deque = new Deque<number>();
    deque.push(1);
    deque.push(2);
    deque.push(3);
    expect(deque.shift()).toBe(1);
    expect(deque.shift()).toBe(2);
    expect(deque.shift()).toBe(3);
  });

  test('should push and shift and pop', () => {
    const deque = new Deque<number>();
    deque.push(1);
    deque.push(2);
    deque.push(3);
    expect(deque.shift()).toBe(1);
    expect(deque.size()).toBe(2);
    expect(deque.pop()).toBe(3);
    expect(deque.size()).toBe(1);
    expect(deque.shift()).toBe(2);
    expect(deque.size()).toBe(0);
    deque.push(4);
    expect(deque.size()).toBe(1);
    expect(deque.shift()).toBe(4);
    expect(deque.size()).toBe(0);
    expect(deque.shift()).toBe(null);
    expect(deque.pop()).toBe(null);
  });

  test('should works and return correct result value with Bitwise calculation', () => {
    const deque = new Deque<number>();
    let result = 1;
    for (let i = 0; i < 1000; i++) {
      deque.push(i);
    }

    for (let i = 0; i < 250; i++) {
      result = (result * (deque.pop() || 1)) % 1000000007
    }
    expect(deque.size()).toBe(750);
    for (let i = 0; i < 250; i++) {
      result = (result * (deque.shift() || 1)) % 1000000007
    }
    expect(deque.size()).toBe(500);
    for (let i = 0; i < 250; i++) {
      result = (result * (deque.shift() || 1)) % 1000000007
    }
    expect(deque.size()).toBe(250);
    for (let i = 0; i < 250; i++) {
      result = (result * (deque.pop() || 1)) % 1000000007
    }

    expect(result).toBe(756641425);
  });
});
