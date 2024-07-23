import "./style.css";
import {
  CounterTextCreatorWithoutReconstruct,
  CounterTextCreatorWithReconstruct,
  createCounterText,
} from "./counter.ts";

{
  const element = document.querySelector<HTMLButtonElement>("#counter1")!;
  let counter = 0;
  const setCounter = (count: number) => {
    counter = count;
    element.innerHTML = createCounterText(counter);
  };
  element.addEventListener("click", () => setCounter(counter + 1));
  setCounter(0);
}
{
  const element = document.querySelector<HTMLButtonElement>("#counter2")!;
  const generator = new CounterTextCreatorWithoutReconstruct(0);
  const setCounter = (count: number) => {
    generator.counter = count;
    element.innerHTML = generator.createText();
  };
  element.addEventListener("click", () => setCounter(generator.counter + 1));
  setCounter(0);
}
{
  const element = document.querySelector<HTMLButtonElement>("#counter3")!;
  const generator = new CounterTextCreatorWithReconstruct(0);
  const setCounter = (count: number) => {
    generator.counter = count;
    element.innerHTML = generator.createText();
  };
  element.addEventListener("click", () => setCounter(generator.counter + 1));
  setCounter(0);
}
