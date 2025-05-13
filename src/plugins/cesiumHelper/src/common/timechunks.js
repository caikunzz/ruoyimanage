export function handle(func, args) {
  if (args.length === 0) return;
  let i = 0;
  function _run() {
    if (i > args.length) return;
    requestIdleCallback((idle) => {
      while (idle.timeRemaining() > 0 && i < args.length) {
        func(args[i]);
        i++;
      }
      _run();
    });
  }
}
