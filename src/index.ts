import { Planner, Operators, TaskMethods, State, Task, Method } from "./types";

import { extend, deepClone, tail } from "./util";

export function create<S extends State>(): Planner<S> {
	const operators: Operators<S> = {} as Operators<S>;
	const taskMethods: TaskMethods<S> = {} as TaskMethods<S>;

	return {
		operators: (toAdd: Operators<S>) => extend(operators, toAdd),
		setMethods: (taskName: string, toAdd: Method<S>[]) => {
			taskMethods[taskName] = toAdd;
		},
		solve: (state: S, tasks: Task[]) => seekPlan(operators, taskMethods, state, tasks, [], 0),
	};
}

function seekPlan<S extends State>(
	operators: Operators<S>,
	taskMethods: TaskMethods<S>,
	state: S,
	tasks: Task[],
	plan: Task[],
	depth: number,
): Task[] | undefined {
	if (tasks.size() === 0) return plan;

	const task1 = tasks[0];
	const taskName = task1[0] as string;

	if (operators[taskName] !== undefined) {
		const operator = operators[taskName];
		const args = tail(task1);
		const newstate = operator(deepClone(state), ...args);

		if (newstate) {
			const solution = seekPlan(operators, taskMethods, newstate, tail(tasks), [...plan, task1], depth + 1);
			if (solution !== undefined) return solution;
		}
	}

	if (taskMethods[taskName] !== undefined) {
		let solution: Task[] | undefined = undefined;
		for (const method of taskMethods[taskName]) {
			const args = tail(task1);
			const subtasks = method(state, ...args);

			if (subtasks !== undefined) {
				solution = seekPlan(operators, taskMethods, state, [...subtasks, ...tail(tasks)], plan, depth + 1);
				if (solution !== undefined) break;
			}
		}

		return solution;
	}

	return undefined;
}
