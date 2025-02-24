export type Group = {
	difficulty: number;
	theme: string;
	words: string[];
};

export type WordPositions = Record<string, { col: number; row: number }>;
