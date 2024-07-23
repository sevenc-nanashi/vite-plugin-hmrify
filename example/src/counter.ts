export const createCounterText = import.meta.hmrify(
  (counter: number) => `count is ${counter} (function)`,
);

class CounterTextCreator {
  constructor(public counter: number) {}
  createText() {
    return `count = ${this.counter} (class)`;
  }
}

@(import.meta.hmrify)
export class CounterTextCreatorWithoutReconstruct extends CounterTextCreator {}

@(import.meta.hmrify({ reconstruct: true }))
export class CounterTextCreatorWithReconstruct extends CounterTextCreator {}
