import React, { useState, useCallback, memo } from 'react';

const Child = memo(({ onClick }: { onClick: () => void }) => {
  console.log('%c👶 Child rendered', 'color: lightgreen');
  return (
    <div>
      <button onClick={onClick}>Click Me (Child)</button>
    </div>
  );
});

export default function App() {
  const [count, setCount] = useState(0);

  // ❌ Try toggling this: useCallback vs plain function
  // const handleClick = () => {
  //   console.log('clicked from child');
  // };

  // ✅ Now with useCallback
  const handleClick = useCallback(() => {
    console.log('clicked from child');
  }, []);

  console.log('%c🏠 Parent rendered', 'color: skyblue');

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <Child onClick={handleClick} />
    </div>
  );
}
