export const createCounterText = import.meta.hmrify(
  (counter: number) => `count = ${counter} (function)`,
);

class CounterTextCreator {
  constructor(public counter: number) {}
  createText() {
    return `count = ${this.counter} (class)`;
  }
}

export const CounterTextCreatorWithoutReconstruct = import.meta.hmrify(
  CounterTextCreator,
);

export const CounterTextCreatorWithReconstruct = import.meta.hmrify(
  { reconstruct: true },
  CounterTextCreator,
);
