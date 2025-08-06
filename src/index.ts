export default function makePipe<T>(): {
  send: (t: T) => void;
  generator: () => AsyncIterableIterator<T>;
  close: () => void;
} {
  const messages: T[] = [];
  let stopped = false;
  let resolveNext: ((value: void) => void) | null = null;

  function close() {
    stopped = true;
    if (resolveNext) {
      resolveNext();
      resolveNext = null;
    }
  }
  function send(t: T) {
    messages.push(t);
    if (resolveNext) {
      resolveNext();
      resolveNext = null;
    }
  }

  async function* generator(): AsyncIterableIterator<T> {
    while (true) {
      if (messages.length > 0) {
        const msg = messages.shift();
        if (msg !== undefined) {
          yield msg;
        }
      } else {
        if (stopped) {
          return;
        }
        const p = Promise.withResolvers();
        resolveNext = p.resolve;
        await p.promise;
      }
    }
  }

  return { send, generator, close };
}
