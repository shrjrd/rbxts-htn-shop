/** A task is represented as an array where the first element is the task name and the rest are arguments */
export type Task = [string, ...defined[]];

/** State can be any object with string keys */
export type State = Record<string, defined>;

/** An operator takes a state and task arguments, returns a new state or undefined if not applicable */
export type Operator<S extends State> = (state: S, ...args: defined[]) => S | undefined;

/** A method takes a state and task arguments, returns subtasks or undefined if not applicable */
export type Method<S extends State> = (state: S, ...args: defined[]) => Task[] | undefined;

/** Collection of operators keyed by task name */
export type Operators<S extends State> = Record<string, Operator<S>>;

/** Collection of methods for a task (multiple methods can apply to the same task) */
export type TaskMethods<S extends State> = Record<string, Method<S>[]>;

export interface Planner<S extends State> {
	operators: (toAdd: Operators<S>) => void;
	setMethods: (taskName: string, methods: Method<S>[]) => void;
	solve: (state: S, tasks: Task[]) => Task[] | undefined;
}
