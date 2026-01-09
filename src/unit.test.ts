import { test, expect } from "@rbxts/jest-globals";

import type { State, Task, Operator, Method } from "./types";

import * as planner from "./index";

interface TravelState extends State {
	loc: Record<string, string>;
	cash: Record<string, number>;
	owe: Record<string, number>;
	dist: Record<string, Record<string, number>>;
}

const taxiRate = (dist: number) => 1.5 + 0.5 * dist;

const walk: Operator<TravelState> = (state, ...args): TravelState | undefined => {
	const [who, from, to] = args as [string, string, string];
	if (state.loc[who] === from) {
		state.loc[who] = to;
		return state;
	} else return undefined;
};

const callTaxi: Operator<TravelState> = (state, ...args): TravelState => {
	const [, from] = args as [string, string];
	state.loc["taxi"] = from;
	return state;
};

const rideTaxi: Operator<TravelState> = (state, ...args): TravelState | undefined => {
	const [who, from, to] = args as [string, string, string];
	if (state.loc["taxi"] === from && state.loc[who] === from) {
		state.loc["taxi"] = to;
		state.loc[who] = to;
		state.owe[who] = taxiRate(state.dist[from][to]);
		return state;
	} else return undefined;
};

const payDriver: Operator<TravelState> = (state, ...args): TravelState | undefined => {
	const [who] = args as [string];
	if (state.cash[who] >= state.owe[who]) {
		state.cash[who] = state.cash[who] - state.owe[who];
		state.owe[who] = 0;
		return state;
	} else return undefined;
};

test("travel example 1", () => {
	const state1: TravelState = {
		loc: { me: "home" },
		cash: { me: 20 },
		owe: { me: 0 },
		dist: { home: { park: 8 }, park: { home: 8 } },
	};
	const travel = setup();
	const solution = travel.solve(state1, [["travel", "me", "home", "park"]]);
	expect(solution![0]).toEqual(["callTaxi", "me", "home"]);
	expect(solution![1]).toEqual(["rideTaxi", "me", "home", "park"]);
	expect(solution![2]).toEqual(["payDriver", "me"]);
});

test("travel example 2", () => {
	const state1: TravelState = {
		loc: { me: "home" },
		cash: { me: 2 },
		owe: { me: 0 },
		dist: { home: { park: 1.3 }, park: { home: 1.3 } },
	};
	const travel = setup();
	const solution = travel.solve(state1, [["travel", "me", "home", "park"]]);
	expect(solution![0]).toEqual(["walk", "me", "home", "park"]);
});

test("move state forward and re-plan", () => {
	const state1: TravelState = {
		loc: { me: "home" },
		cash: { me: 20 },
		owe: { me: 0 },
		dist: { home: { park: 8 }, park: { home: 8 } },
	};
	const travel = setup();
	const solution = travel.solve(state1, [["travel", "me", "home", "park"]]);
	expect(solution![0]).toEqual(["callTaxi", "me", "home"]);
	const state2 = callTaxi(state1, "me", "home")!;
	const solution2 = travel.solve(state2, [["travel", "me", "home", "park"]]);
	expect(solution2![0]).toEqual(["rideTaxi", "me", "home", "park"]);
	rideTaxi(state2, "me", "home", "park");
});

test("there and back, and getting home is shorter for some reason", () => {
	const state1: TravelState = {
		loc: { me: "home" },
		cash: { me: 20 },
		owe: { me: 0 },
		dist: { home: { park: 8.0 }, park: { home: 1.3 } },
	};
	const travel = setup();
	const solution = travel.solve(state1, [
		["travel", "me", "home", "park"],
		["travel", "me", "park", "home"],
	]);
	expect(solution![0]).toEqual(["callTaxi", "me", "home"]);
	expect(solution![1]).toEqual(["rideTaxi", "me", "home", "park"]);
	expect(solution![2]).toEqual(["payDriver", "me"]);
	expect(solution![3]).toEqual(["walk", "me", "park", "home"]);

	// test that the original state is not mutated
	expect(state1.loc.me).toBe("home");
	expect(state1.cash.me).toBe(20);
	expect(state1.owe.me).toBe(0);
});

function setup() {
	const travel = planner.create<TravelState>();
	travel.operators({ walk, callTaxi, rideTaxi, payDriver });

	const travelByFoot: Method<TravelState> = (state, ...args): Task[] | undefined => {
		const [who, from, to] = args as [string, string, string];
		if (state.dist[from][to] <= 2) return [["walk", who, from, to]];
		return undefined;
	};

	const travelByTaxi: Method<TravelState> = (state, ...args): Task[] | undefined => {
		const [who, from, to] = args as [string, string, string];
		if (state.dist[from][to] <= 2) return undefined; // we can walk this
		if (state.cash[who] < taxiRate(state.dist[from][to])) return undefined;
		if (state.loc.taxi === state.loc[who])
			return [
				["rideTaxi", who, from, to],
				["payDriver", who],
			];
		return [
			["callTaxi", who, from],
			["rideTaxi", who, from, to],
			["payDriver", who],
		];
	};

	travel.setMethods("travel", [travelByFoot, travelByTaxi]);
	return travel;
}
