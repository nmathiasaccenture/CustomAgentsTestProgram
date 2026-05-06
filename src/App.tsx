import { Counter } from "./components/Counter";

export function App() {
  return (
    <main className="app">
      <h1>Counter</h1>
      <Counter initial={0} step={1} />
    </main>
  );
}
