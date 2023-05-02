export const Direction = {
    None: 0,
    Left: 1,
    Right: 2,
    Up: 3,
    Down: 4,
} as const;
export type Direction = typeof Direction[keyof typeof Direction];

export function n_array<T>(length: number, map: (v: unknown, k: number) => T): T[] {
    return Array.from({ length: length }, map)
}

export class UnionFind {
    parent: number[];
    rank: number[];

    constructor(N: number) {
        this.rank = n_array(N, () => 0);
        this.parent = n_array(N, (v, k) => k);
    }
    root(i: number): number {
        if (this.parent[i] == i)
            return i;

        const root = this.root(this.parent[i]);
        this.parent[i] = root;
        return root;
    }
    unite(a: number, b: number): void {
        a = this.root(a);
        b = this.root(b);
        if (a == b)
            return;

        if (this.rank[a] < this.rank[b])
            this.parent[a] = b;
        else {
            this.parent[b] = a;
            if (this.rank[b] == this.rank[a])
                this.rank[a] += 1;
        }
    }
}

// a:開始速度
// b: 終了速度
export function hermite(s: number, e: number, t: number, a: number, b: number) {
    if (t <= 0) return s;
    if (1 <= t) return e;
    
    //0～1でエルミート補間
    const weight = (a + b - 2) * t * t * t + (-2 * a - b + 3) * t * t + a * t;
    //始点と終点で補間
    return s + (e - s) * weight;
}

// 減衰振動
// x = 経過時間(ms)
// T = 周期（ms）
// R = 1周期後の減衰率（無次元）
export function elastic(s: number, e: number, x: number, T: number = 250, R: number = 0.03) {
    if (x <= 0) return s;
    const tau = 2 * Math.PI;
    const p = Math.atan(tau / Math.log(R));
    
    //減衰振動
    const weight = Math.sin(p - tau / T * x) / Math.sin(p) * Math.pow(R, x / T);

    return e + (s - e) * weight;
}