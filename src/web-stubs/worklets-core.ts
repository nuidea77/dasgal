export const Worklets = { createRunOnJS: <T extends (...args: never[]) => unknown>(fn: T) => fn };
