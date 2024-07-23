export const createCounterText = import.meta.hmrify(
  (counter: number) => `count is ${counter}`,
);

class CounterTextCreator {
  constructor(public counter: number) {}
  createText() {
    return `count is ${this.counter}`;
  }
}

export const CounterTextCreatorWithoutReconstruct = import.meta.hmrify(
  { reconstruct: true },
  CounterTextCreator,
);

export const CounterTextCreatorWithReconstruct = import.meta.hmrify(
  CounterTextCreator,
);
